# WhatsApp checkout

Destination: `2349137132516`. Checkout uses the direct number link with encoded order text, rather than the business's fixed short link.

`POST /api/orders` validates the cart, loads current catalogue prices and inventory, and saves an immutable `OrderEnquiry` snapshot before returning the message. Browser-provided prices and product names are not trusted. Bulk tiers apply per line, matching the cart. Stock is checked across all lines sharing a variant; this enquiry does not reserve stock.

Custom designs and unlisted colours require a quote, and are excluded from the priced subtotal. Delivery and payment remain unconfirmed. The snapshot includes print text, font, ink, colour, quantities, uploaded raster artwork and logo positions. Artwork is stored as data URLs in the JSON snapshot for this first phase (6 MB total request limit, 1.5 MB per encoded image). It is not attached to the WhatsApp message.

The browser saves an idempotency token in session storage for the current cart. Retrying the same request returns the same reference; editing the cart generates a new token. The stored message and prices remain a snapshot, not a stock guarantee. No order details are exposed through a public read endpoint.

The customer must press Send in WhatsApp. Status remains `AWAITING_WHATSAPP`: it does not imply the message was sent, paid, or accepted. After a successful save, a session receipt is preserved and unchanged checked-out lines are cleared from the cart. Failures retain the cart. The confirmation page provides copy/reopen controls and a complete text preview; messages whose encoded link exceeds 7,000 characters use copy/paste instead of truncation.

Signed-in checkout derives the customer identity from the session cookie, never the request body. Authenticated `GET /api/orders/mine` returns only that customer's history, paginated at 20 orders per page. Guest orders remain unowned. Account history distinguishes awaiting confirmation from `COMPLETED` and `CANCELLED`; customers cannot change order status. Staff completion controls remain deferred.

Apply the database migration and regenerate Prisma before running checkout. Build shared and database packages before starting the backend. Without the migration or a working backend, checkout reports an error and does not open WhatsApp with an unsaved order.

Future phase: authenticated staff dashboard at `/admin/orders/{id}`, rendering the versioned snapshot and artwork. Only then add a staff order link to the WhatsApp message. Staff authentication and authorisation must be implemented before exposing saved snapshots. Object storage can replace inline artwork as upload volumes grow.
