const prisma = require('../config/db');
const { checkContent } = require('../services/aiModerator');

/**
 * Get all listings with advanced filtering, search, and sorting
 * GET /api/listings
 */
const getListings = async (req, res) => {
  try {
    const {
      search,
      category,
      type, // SELL, RENT, SWAP
      condition, // BRAND_NEW, LIKE_NEW, GOOD, FAIR
      minPrice,
      maxPrice,
      status = 'AVAILABLE',
      sortBy = 'newest', // newest, price_asc, price_desc, popular
      limit = 50,
      page = 1,
      sellerId,
    } = req.query;

    const where = {};

    // Only show approved listings publicly unless requested by the seller or admin
    if (!sellerId && (!req.user || req.user.role !== 'ADMIN')) {
      where.moderationStatus = 'APPROVED';
    }

    // Filter by status (unless 'all' is requested)
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Filter by seller
    if (sellerId) {
      where.sellerId = parseInt(sellerId);
    }

    // Filter by category (id or slug)
    if (category) {
      if (isNaN(category)) {
        where.category = { slug: category.toLowerCase() };
      } else {
        where.categoryId = parseInt(category);
      }
    }

    // Filter by type (SELL, RENT, SWAP)
    if (type && type !== 'ALL') {
      where.type = type.toUpperCase();
    }

    // Filter by condition
    if (condition && condition !== 'ALL') {
      where.condition = condition.toUpperCase();
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Search query across title, description, pickup location, swap preferences
    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { pickupLocation: { contains: q } },
        { swapPreferences: { contains: q } },
      ];
    }

    // Sorting
    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    if (sortBy === 'popular') orderBy = { views: 'desc' };
    if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const [total, listings] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              campus: true,
              role: true,
            },
          },
          _count: {
            select: { savedBy: true, transactions: true },
          },
        },
        orderBy,
        take,
        skip,
      }),
    ]);

    // If user is authenticated, check which items they saved
    let savedListingIds = new Set();
    if (req.user) {
      const userSaved = await prisma.savedItem.findMany({
        where: { userId: req.user.id },
        select: { listingId: true },
      });
      savedListingIds = new Set(userSaved.map((s) => s.listingId));
    }

    const formattedListings = listings.map((item) => ({
      ...item,
      isSaved: savedListingIds.has(item.id),
      saveCount: item._count.savedBy,
    }));

    return res.status(200).json({
      success: true,
      count: formattedListings.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / take),
      listings: formattedListings,
    });
  } catch (error) {
    console.error('GetListings Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve listings.',
      error: error.message,
    });
  }
};

/**
 * Get a single listing by ID with full details
 * GET /api/listings/:id
 */
const getListingById = async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);

    // Increment views atomically
    const listing = await prisma.listing.update({
      where: { id: listingId },
      data: { views: { increment: 1 } },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            campus: true,
            bio: true,
            phone: true,
            createdAt: true,
            reviewsReceived: {
              select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                reviewer: {
                  select: { id: true, name: true, avatar: true },
                },
              },
            },
          },
        },
        _count: {
          select: { savedBy: true, reports: true },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.',
      });
    }

    // Check if saved by current user
    let isSaved = false;
    if (req.user) {
      const saved = await prisma.savedItem.findUnique({
        where: {
          userId_listingId: {
            userId: req.user.id,
            listingId: listing.id,
          },
        },
      });
      isSaved = !!saved;
    }

    // Calculate seller rating
    const ratings = listing.seller.reviewsReceived.map((r) => r.rating);
    const sellerAvgRating =
      ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : 5.0;

    // Get 4 related listings from the same category
    const related = await prisma.listing.findMany({
      where: {
        categoryId: listing.categoryId,
        id: { not: listing.id },
        status: 'AVAILABLE',
      },
      take: 4,
      include: {
        category: true,
        seller: {
          select: { id: true, name: true, avatar: true, campus: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      listing: {
        ...listing,
        isSaved,
        seller: {
          ...listing.seller,
          averageRating: parseFloat(sellerAvgRating),
          reviewCount: ratings.length,
        },
      },
      relatedListings: related,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch listing details.',
      error: error.message,
    });
  }
};

/**
 * Create a new listing
 * POST /api/listings
 */
const createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      originalPrice,
      categoryId,
      condition = 'GOOD',
      type = 'SELL',
      imageUrl,
      pickupLocation,
      rentDuration,
      swapPreferences,
    } = req.body;

    if (!title || !description || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category are required.',
      });
    }

    // If a file was uploaded via multipart/form-data
    let finalImageUrl = imageUrl;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    // Default fallback placeholder image if none provided
    if (!finalImageUrl) {
      finalImageUrl = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600';
    }

    // Run AI content moderation check
    const aiCheck = checkContent({
      title,
      description,
      swapPreferences,
      price: parseFloat(price) || 0.0,
    });

    const isFlagged = aiCheck.isFlagged;
    const moderationStatus = isFlagged ? 'FLAGGED_AI' : 'APPROVED';

    const listing = await prisma.listing.create({
      data: {
        sellerId: req.user.id,
        categoryId: parseInt(categoryId),
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price) || 0.0,
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        condition: condition.toUpperCase(),
        type: type.toUpperCase(),
        status: isFlagged ? 'RESERVED' : 'AVAILABLE',
        moderationStatus,
        isFlaggedByAI: isFlagged,
        aiFlagReason: isFlagged ? aiCheck.reason : null,
        imageUrl: finalImageUrl,
        pickupLocation: pickupLocation || 'Campus Library / Student Center',
        rentDuration: type.toUpperCase() === 'RENT' ? rentDuration || 'per day' : null,
        swapPreferences: type.toUpperCase() === 'SWAP' ? swapPreferences : null,
      },
      include: {
        category: true,
        seller: {
          select: { id: true, name: true, email: true, avatar: true, collegeId: true, phone: true },
        },
      },
    });

    // If AI flagged prohibited/misleading content, alert all Admins immediately & auto-create report
    if (isFlagged) {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: '🚨 Misleading/Prohibited Item Flagged by AI',
            message: `Student ${req.user.name} (${req.user.collegeId || req.user.email} - Phone: ${req.user.phone || 'N/A'}) posted restricted item: "${title}". Reason: ${aiCheck.reason}`,
            type: 'SYSTEM',
            link: '/admin',
          },
        });
      }

      await prisma.report.create({
        data: {
          reporterId: req.user.id,
          listingId: listing.id,
          reason: 'INAPPROPRIATE',
          description: `AI Detection Flag: ${aiCheck.reason}`,
          status: 'PENDING',
        },
      });

      return res.status(201).json({
        success: true,
        isFlagged: true,
        message: 'Item flagged by AI moderation for prohibited/misleading content and sent to campus admin for review.',
        listing,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Listing published successfully!',
      listing,
    });
  } catch (error) {
    console.error('CreateListing Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create listing.',
      error: error.message,
    });
  }
};

/**
 * Update an existing listing (Owner or Admin)
 * PUT /api/listings/:id
 */
const updateListing = async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.',
      });
    }

    // Authorization: only the seller or an ADMIN can edit
    if (listing.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this listing.',
      });
    }

    const {
      title,
      description,
      price,
      originalPrice,
      categoryId,
      condition,
      type,
      status,
      imageUrl,
      pickupLocation,
      rentDuration,
      swapPreferences,
    } = req.body;

    let finalImageUrl = imageUrl;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: {
        ...(title && { title: title.trim() }),
        ...(description && { description: description.trim() }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice ? parseFloat(originalPrice) : null }),
        ...(categoryId && { categoryId: parseInt(categoryId) }),
        ...(condition && { condition: condition.toUpperCase() }),
        ...(type && { type: type.toUpperCase() }),
        ...(status && { status: status.toUpperCase() }),
        ...(finalImageUrl && { imageUrl: finalImageUrl }),
        ...(pickupLocation && { pickupLocation }),
        ...(rentDuration !== undefined && { rentDuration }),
        ...(swapPreferences !== undefined && { swapPreferences }),
      },
      include: {
        category: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Listing updated successfully.',
      listing: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update listing.',
      error: error.message,
    });
  }
};

/**
 * Delete a listing (Owner or Admin)
 * DELETE /api/listings/:id
 */
const deleteListing = async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.',
      });
    }

    // Authorization: only the seller or an ADMIN can delete
    if (listing.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this listing.',
      });
    }

    await prisma.listing.delete({
      where: { id: listingId },
    });

    return res.status(200).json({
      success: true,
      message: 'Listing removed successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete listing.',
      error: error.message,
    });
  }
};

/**
 * Toggle bookmark / favorite item
 * POST /api/listings/:id/save
 */
const toggleSaveListing = async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);
    const userId = req.user.id;

    const existing = await prisma.savedItem.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });

    if (existing) {
      await prisma.savedItem.delete({
        where: { id: existing.id },
      });
      return res.status(200).json({
        success: true,
        isSaved: false,
        message: 'Removed from saved items.',
      });
    } else {
      await prisma.savedItem.create({
        data: {
          userId,
          listingId,
        },
      });
      return res.status(200).json({
        success: true,
        isSaved: true,
        message: 'Saved to your favorites!',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error toggling saved item.',
      error: error.message,
    });
  }
};

/**
 * Get current user's saved wishlist items
 * GET /api/listings/saved
 */
const getSavedListings = async (req, res) => {
  try {
    const saved = await prisma.savedItem.findMany({
      where: { userId: req.user.id },
      include: {
        listing: {
          include: {
            category: true,
            seller: {
              select: { id: true, name: true, avatar: true, campus: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const listings = saved.map((s) => ({
      ...s.listing,
      isSaved: true,
    }));

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch saved items.',
      error: error.message,
    });
  }
};

/**
 * Get current user's posted listings
 * GET /api/listings/my-listings
 */
const getMyListings = async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { sellerId: req.user.id },
      include: {
        category: true,
        _count: {
          select: { transactions: true, savedBy: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your listings.',
      error: error.message,
    });
  }
};

module.exports = {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  toggleSaveListing,
  getSavedListings,
  getMyListings,
};
