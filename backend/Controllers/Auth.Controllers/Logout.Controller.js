export const Logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ status: 'error', message: "Failed to log out" });
        }
        res.clearCookie('connect.sid', { path: '/' });
        return res.status(200).json({ status: 'success', message: "Logout successful" });
    });
};