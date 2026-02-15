#!/bin/bash

# Screenshot Capture Script for Mindaroo Pitch
# Automatically captures screenshots of all platform pages

echo "🚀 Starting screenshot capture for JusticeHub platform..."
echo ""

# Check if server is running
if ! curl -s http://localhost:4000 > /dev/null; then
    echo "❌ Error: Dev server not running at localhost:4000"
    echo "Please start the server first: PORT=4000 npm run dev"
    exit 1
fi

# Create screenshots directory
SCREENSHOT_DIR="./public/screenshots/mindaroo-pitch/platform"
mkdir -p "$SCREENSHOT_DIR"

echo "✅ Server is running"
echo "📁 Screenshots will be saved to: $SCREENSHOT_DIR"
echo ""

# Array of pages to capture
declare -a pages=(
    "/:platform-homepage-full.png"
    "/community-programs:platform-programs-list.png"
    "/stories:platform-stories-list.png"
    "/centre-of-excellence/map:platform-excellence-map.png"
    "/admin:admin-dashboard.png"
    "/admin/stories/new:admin-stories-editor.png"
    "/wiki/mindaroo-pitch/one-pager:wiki-mindaroo-one-pager.png"
    "/blog:platform-blog-list.png"
    "/services:platform-services-list.png"
    "/organizations:platform-organizations-list.png"
    "/people:platform-people-list.png"
    "/community-map:platform-community-map.png"
    "/art-innovation:platform-art-innovation-list.png"
    "/admin/blog:admin-blog-list.png"
    "/admin/programs:admin-programs-list.png"
    "/admin/media:admin-media-library.png"
    "/admin/auto-linking:admin-auto-linking.png"
    "/admin/empathy-ledger:admin-empathy-ledger.png"
    "/admin/organizations:admin-organizations-list.png"
    "/centre-of-excellence:platform-excellence-home.png"
    "/centre-of-excellence/global-insights:platform-excellence-insights.png"
    "/centre-of-excellence/research:platform-excellence-research.png"
    "/centre-of-excellence/best-practice:platform-excellence-best-practice.png"
    "/visuals/network:platform-visuals-network.png"
    "/visuals/flow:platform-visuals-flow.png"
    "/visuals/connections:platform-visuals-connections.png"
    "/wiki/mindaroo-pitch/strategic-pitch:wiki-mindaroo-strategic.png"
)

echo "📸 Manual Screenshot Instructions:"
echo "=================================="
echo ""
echo "This script will open each page in your browser."
echo "Please take a screenshot of each page manually."
echo ""
echo "macOS: Cmd+Shift+4, then press Spacebar, click window"
echo "Windows: Win+Shift+S"
echo "Linux: PrtScn or use Gnome Screenshot"
echo ""
echo "Press Enter to start..."
read

for page_info in "${pages[@]}"; do
    IFS=':' read -r path filename <<< "$page_info"
    url="http://localhost:4000${path}"

    echo ""
    echo "🌐 Opening: $url"
    echo "💾 Save as: $filename"
    echo ""

    # Open in default browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$url"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        start "$url"
    fi

    echo "Take screenshot and save as: $SCREENSHOT_DIR/$filename"
    echo "Press Enter when done (or 's' to skip)..."
    read response

    if [[ "$response" == "s" ]]; then
        echo "⏭️  Skipped"
        continue
    fi

    # Check if file exists
    if [ -f "$SCREENSHOT_DIR/$filename" ]; then
        echo "✅ Screenshot saved!"
    else
        echo "⚠️  File not found - you'll need to add it manually"
    fi
done

echo ""
echo "=================================="
echo "✨ Screenshot capture complete!"
echo ""
echo "📁 Location: $SCREENSHOT_DIR"
echo "🌐 View gallery: http://localhost:4000/wiki/mindaroo-pitch/screenshots"
echo ""
echo "Next steps:"
echo "1. Optimize images with TinyPNG or similar"
echo "2. Refresh the gallery page to see all screenshots"
echo ""
