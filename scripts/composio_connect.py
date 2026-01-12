import anthropic

from composio import Composio
from composio_anthropic import AnthropicProvider


composio = Composio(api_key="ak_cFX_w-Yx_yS4nRTS2Fvu", provider=AnthropicProvider())

# env: ANTHROPIC_API_KEY
anthropic_client = anthropic.Anthropic()

# Id of the user in your system
externalUserId = "pg-test-6b5175df-0b23-484a-86c4-5b90cbc779b8"

connection_request = composio.connected_accounts.link(user_id=externalUserId, auth_config_id="ac_G3XhUINDVYt2")

# Redirect user to the OAuth flow
redirect_url = connection_request.redirect_url
print(f'Please authorize the app by visiting this URL: {redirect_url}')

# Wait for the connection to be established
connected_account = connection_request.wait_for_connection()
print(f'Connection established successfully! Connected account id: {connected_account.id}')
