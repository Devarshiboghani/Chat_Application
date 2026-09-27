const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        status: user.status,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get Profile Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, profileImage } = req.body;

    // Build update object securely (only allow specific fields)
    const updateData = {};
    if (name !== undefined) {
      if (name.trim() === '') {
         return res.status(400).json({
           success: false,
           message: 'Name cannot be empty'
         });
      }
      updateData.name = name;
    }
    if (profileImage !== undefined) {
      updateData.profileImage = profileImage;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage,
        role: updatedUser.role,
        status: updatedUser.status,
        lastSeen: updatedUser.lastSeen,
        createdAt: updatedUser.createdAt
      }
    });

  } catch (error) {
    console.error('Update Profile Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

const searchUsers = async (req, res) => {
  try {
    const searchQuery = req.query.q || '';
    
    if (searchQuery.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Search query is too long'
      });
    }

    const query = { _id: { $ne: req.user.userId } };
    
    if (searchQuery.trim() !== '') {
      const safeQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: safeQuery, $options: 'i' } },
        { email: { $regex: safeQuery, $options: 'i' } }
      ];
    }

    // Search by name or email (if provided), case-insensitive, excluding current user
    const users = await User.find(query).select('-password').limit(500);

    // Format output
    const formattedUsers = users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      profileImage: u.profileImage,
      status: u.status,
      lastSeen: u.lastSeen
    }));

    res.status(200).json({
      success: true,
      users: formattedUsers
    });
  } catch (error) {
    console.error('Search Users Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  searchUsers
};
