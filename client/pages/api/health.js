export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    endpoints: {
      auth: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        profile: '/api/auth/profile'
      },
      wallets: {
        list: '/api/wallets',
        create: '/api/wallets'
      }
    }
  });
}