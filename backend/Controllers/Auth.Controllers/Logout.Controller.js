export const Logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ message: "Failed to log out" });
        }
        res.clearCookie('connect.sid', { path: '/' }); // Clear the session cookie
        return res.status(200).json({ message: "Logout successful" });
    })
}