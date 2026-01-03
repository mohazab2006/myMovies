# Logo Setup Instructions

To add your own logo to the app:

1. **Add your logo file** to this `/public` folder
   - Supported formats: `.png`, `.svg`, `.jpg`, `.jpeg`
   - Recommended name: `logo.png` or `logo.svg`
   - Recommended size: 40x40 pixels (or larger, it will be scaled)

2. **The logo will automatically appear** in the navbar
   - If the logo file is not found, a 🎬 emoji will be shown as fallback

3. **File location**: `/public/logo.png` (or your preferred filename)

4. **Update the Navbar component** if you use a different filename:
   - Edit `components/Navbar.tsx`
   - Change `src="/logo.png"` to your filename

That's it! Your logo will appear in the top-left corner of the navbar.


