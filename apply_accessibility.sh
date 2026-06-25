# Update layout.tsx
sed -i 's/<body>/<body>\n        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 p-4 bg-white text-black">\n          Skip to main content\n        <\/a>/' src/app/layout.tsx
sed -i 's/<main>/<main id="main-content" role="main">/' src/app/layout.tsx

# Update navbar.tsx (Add landmark)
sed -i 's/<nav/<nav role="navigation" aria-label="Main Navigation"/' components/navbar.tsx

# Update footer.tsx (Add landmark)
sed -i 's/<footer/<footer role="contentinfo" aria-label="Site Footer"/' components/footer.tsx
