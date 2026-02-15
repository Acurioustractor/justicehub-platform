from composio import Composio
from composio_anthropic import AnthropicProvider

composio = Composio(api_key="ak_cFX_w-Yx_yS4nRTS2Fvu", provider=AnthropicProvider())

# Get all connected accounts for this user
externalUserId = "pg-test-6b5175df-0b23-484a-86c4-5b90cbc779b8"

try:
    # Get connected accounts
    connected_accounts = composio.connected_accounts.get(entity_id=externalUserId)

    print(f"✅ Gmail successfully connected!")
    print("=" * 60)
    print(f"User ID: {externalUserId}")
    print("=" * 60)

    # You can now use Gmail actions with Composio
    print("\n📧 Available Gmail actions:")
    print("- Send emails")
    print("- Read emails")
    print("- Search emails")
    print("- Create drafts")
    print("- And more...")

except Exception as e:
    print(f"❌ Error: {e}")
    print("\nTrying alternative method...")

    try:
        # List all connected accounts
        accounts = composio.connected_accounts.list()
        print(f"\n✅ Found {len(accounts)} connected account(s)")

        for account in accounts:
            print(f"\nAccount ID: {account.id}")
            print(f"Status: {account.status}")

    except Exception as e2:
        print(f"❌ Also failed: {e2}")
