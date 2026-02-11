Connect
Check the docs for installation
MCP URL
:
mcp.context7.com/mcp

API URL
:
context7.com/api/v2

Claude Code
OpenCode
Cursor
Codex
VS Code
Windsurf
More
Remote
Local

[mcp_servers.context7]
url = "https://mcp.context7.com/mcp"
http_headers = { "CONTEXT7_API_KEY" = "YOUR_API_KEY" }
API
Use the Context7 API to search libraries and fetch documentation programmatically

Search
Context

curl -X GET "https://context7.com/api/v2/context?libraryId=/vercel/next.js&query=setup+ssr&type=json" \
 -H "Authorization: Bearer CONTEXT7_API_KEY"
Parameters
libraryId - Library ID (e.g., /vercel/next.js)
query - Question or task to get documentation for
type - Response format (txt or json, default: txt)
Format
TXT
JSON
Response

{
"codeSnippets": [
{
"codeTitle": "Dynamically Load Client-Side Only Component",
"codeDescription": "Explains how to prevent server-side rendering...",
"codeLanguage": "jsx",
"codeTokens": 130,
"codeId": "lazy-loading.mdx#\_snippet_7",
"pageTitle": "How to lazy load Client Components and libraries",
"codeList": [
{
"language": "jsx",
"code": "'use client'\n\nimport dynamic from 'next/dynamic'\n\nconst DynamicHeader = dynamic(() => import('../components/header'), {\n ssr: false,\n})"
}
]
},
...
],
"infoSnippets": [
{
"pageId": "lazy-loading.mdx",
"breadcrumb": "Examples > With no SSR",
"content": "To dynamically load a component on the client side...",
"contentTokens": 42
},
...
]
}

claude mcp add --header "CONTEXT7_API_KEY:ctx7sk-22875606-627a-4926-9878-1b65cb494936" --transport http context7 https://mcp.context7.com/mcp
