# Connecting Figma to Claude Code via Composio MCP

## 🎯 What This Enables

Once connected, you can:
- ✅ Get Figma designs and convert them to React components
- ✅ Read design specs programmatically
- ✅ Generate pixel-perfect HTML/CSS from Figma frames
- ✅ Clone designs from Figma URLs
- ✅ Build production-ready code from mockups

Perfect for converting your JusticeHub visual designs into actual components!

---

## 📋 Setup Steps

### Step 1: Get Your Setup Command

1. **Visit:** https://mcp.composio.dev
2. **Find "Figma"** in the list of integrations
3. **Click "Generate Command"**
4. You'll get a command like:

```bash
npx @composio/mcp@latest setup "https://mcp.composio.dev/partner/composio/figma/mcp?customerId=YOUR_CUSTOMER_ID" "figma-XXXXX-XX" --client claude-code
```

⚠️ **Important:** Copy YOUR specific command (it has your customer ID)

---

### Step 2: Run the Setup Command

Open your terminal and paste the command from Step 1.

Example:
```bash
npx @composio/mcp@latest setup "https://mcp.composio.dev/partner/composio/figma/mcp?customerId=abc123xyz" "figma-605dcr-13" --client claude-code
```

This will:
- Install the Figma MCP for Claude Code
- Configure the connection
- Give you an authorization URL

---

### Step 3: Authenticate with Figma

The setup will output a URL like:
```
Please authorize by visiting: https://connect.composio.dev/link/lk_XXXXXXXXX
```

1. **Click the URL** (or copy-paste into browser)
2. **Authorize Composio** to access your Figma account
3. You'll see: "Successfully connected Composio to Figma"
4. Close the browser window

---

### Step 4: Verify Connection

Restart Claude Code (if already running):
```bash
# If Claude Code is running, exit and restart
# Then check MCP connections:
/mcp
```

You should see Figma MCP listed as connected.

---

## 🎨 Example Usage

### Get Design from Figma URL
```
User: "Analyze this Figma file: https://www.figma.com/file/ABC123/JusticeHub-Visuals"
Claude: [Reads the design, describes frames, components, colors, typography]
```

### Generate React Components
```
User: "Create a React component that matches Frame 1 - Network Effect Visual"
Claude: [Generates pixel-perfect React code with exact colors, spacing, layout]
```

### Clone Entire Design
```
User: "Build all four visual components from this Figma file as separate React files"
Claude: [Creates NetworkMap.tsx, SystemTransformation.tsx, LocalToScale.tsx, ConnectionWeb.tsx]
```

### Extract Design Specs
```
User: "What are the exact colors, fonts, and spacing used in the Connection Web visual?"
Claude: [Provides precise design tokens: colors, typography, margins, padding]
```

---

## 🎯 For JusticeHub Visuals Workflow

### Recommended Workflow:

1. **Create rough layouts in Figma**
   - Use Figma's built-in tools (rectangles, circles, text, arrows)
   - Don't worry about perfect code - focus on visual design
   - Use auto-layout for better structure

2. **Share the Figma file**
   - Get the share link from Figma
   - Make sure it's set to "Anyone with the link can view"

3. **Use Claude Code to generate production code**
   ```bash
   claude
   ```

   Then say:
   ```
   "Here's my Figma design: [FIGMA_URL]

   Please create production-ready React components for all four visuals:
   1. Network Effect
   2. System Transformation
   3. Local to Scale
   4. Connection Web

   Use TypeScript, Tailwind CSS, and make them responsive."
   ```

4. **Iterate on the code**
   - Claude can adjust colors, spacing, responsiveness
   - Add interactivity, animations, export features
   - Refine based on your feedback

---

## 🔧 Troubleshooting

### "MCP not found"
- Make sure you ran the setup command with `--client claude-code`
- Restart Claude Code after setup

### "Authentication failed"
- Check that you're logged into Figma in your browser
- Try the authorization URL again
- Make sure your Figma account has access to the files you want to read

### "Can't access Figma file"
- Ensure the file is shared with "Anyone with link can view"
- Check that the URL is correct
- Make sure you're using a File URL, not a Prototype URL

---

## 📚 Advanced: Using with Anthropic API

You can also use Figma + Composio directly with the Anthropic API (like we did with Gmail):

```python
import anthropic
from composio import Composio
from composio_anthropic import AnthropicProvider

composio = Composio(api_key="ak_cFX_w-Yx_yS4nRTS2Fvu", provider=AnthropicProvider())
anthropic_client = anthropic.Anthropic()

# Get Figma tools
tools = composio.get_tools(apps=["figma"], entity_id="pg-test-6b5175df-0b23-484a-86c4-5b90cbc779b8")

# Use with Claude
response = anthropic_client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=4096,
    tools=tools,
    messages=[{
        "role": "user",
        "content": "Get the design from this Figma file: [URL]"
    }]
)
```

---

## ✅ Benefits Over Plugin

Why Composio MCP > Figma Plugin:

| Feature | Composio MCP | Figma Plugin |
|---------|--------------|--------------|
| **Setup** | One command | Manual plugin install |
| **Works with** | Web + Desktop Figma | Desktop only |
| **Stability** | Very stable | Can be buggy |
| **Reading designs** | Excellent | Limited |
| **Code generation** | Full access to Claude | Restricted |
| **No Figma desktop needed** | ✅ | ❌ |

---

## 🎉 You're Ready!

Once you complete the setup:
1. Create your visuals in Figma
2. Share the link
3. Tell Claude Code: "Build production components from this Figma file"
4. Get pixel-perfect React code instantly

Much better than trying to draw SVGs manually! 🎨→💻
