import jwt from 'jsonwebtoken';
import storage from '../../../lib/storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-change-this-in-production';

// Middleware to authenticate user
function authenticateToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const userToken = authenticateToken(req);
  
  if (!userToken) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  switch (req.method) {
    case 'GET':
      // Get user profile
      try {
        const user = storage.findUserById(userToken.id);
        
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        // Return user without password
        const { password: _password, ...userProfile } = user;

        res.status(200).json({
          success: true,
          data: userProfile
        });

      } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch profile'
        });
      }
      break;

    case 'PUT':
      // Update user profile
      try {
        const { firstName, lastName, email } = req.body;

        if (!firstName || !lastName) {
          return res.status(400).json({
            success: false,
            message: 'First name and last name are required'
          });
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== userToken.email) {
          const existingUser = storage.findUserByEmail(email);
          if (existingUser && existingUser.id !== userToken.id) {
            return res.status(400).json({
              success: false,
              message: 'Email is already taken'
            });
          }
        }

        const updatedUser = storage.updateUser(userToken.id, {
          firstName,
          lastName,
          email: email || userToken.email
        });

        if (!updatedUser) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        // Return updated user without password
        const { password: _password2, ...userProfile } = updatedUser;

        res.status(200).json({
          success: true,
          message: 'Profile updated successfully',
          data: userProfile
        });

      } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to update profile'
        });
      }
      break;

    default:
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
  }
}