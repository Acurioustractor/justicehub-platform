from composio import Composio
from composio_anthropic import AnthropicProvider

composio = Composio(api_key="ak_cFX_w-Yx_yS4nRTS2Fvu", provider=AnthropicProvider())

externalUserId = "pg-test-6b5175df-0b23-484a-86c4-5b90cbc779b8"

print("=" * 60)
print("🎉 Gmail Connection Test")
print("=" * 60)

# Test by getting available Gmail actions
try:
    tools = composio.get_tools(apps=["gmail"], entity_id=externalUserId)

    print(f"\n✅ SUCCESS! Gmail is connected!")
    print(f"\nAvailable Gmail tools: {len(tools)}")

    print("\nFirst 10 available actions:")
    for i, tool in enumerate(tools[:10]):
        print(f"  {i+1}. {tool.name}")

    print("\n🎉 Your Gmail account is ready to use with Composio!")

except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nIf you just connected, it may take a moment to sync.")
