# Wristband reference implementation

The product page follows the supplied reference's gallery, five thumbnails, yellow promotional banner, four feature icons, unified 11-colour palette, quantity stepper, purchase panel, bulk pricing and photographic use-case cards.

Prices come from the catalog. The reference's sample review score is omitted because review data is not configured. Buy now saves the selection and opens order review; WhatsApp checkout remains pending. Printed photographs are examples, not text added to a plain wristband order.

## Assets

Generated with the built-in imagegen tool and saved in `apps/frontend/public/images/`:

- `product-hero.png`: Photorealistic yellow Tyvek loop, ivory fibrous interior, warm grey studio background and soft shadow; exact print “GOOD TIMES.”, “GREAT PEOPLE.”, “ALL ACCESS • 2026”. Portrait 4:5 product photograph, no UI or watermark.
- `product-promo.png`: Landscape 2.2:1 studio photograph of stacked yellow, pink and blue silicone bands printed “BAND-IT”, “GOOD PEOPLE.” and “ALL ACCESS.” on the right, empty pale creamy yellow space on the left for HTML copy.
- `product-festival.png`: Landscape 2.3:1 editorial concert crowd photograph, raised arms, warm gold stage lights and confetti; no logos or text.
- `product-nightlife.png`: Landscape 2.3:1 editorial nightclub crowd, purple, blue and magenta lasers and spotlights; no logos or text.
- `product-conference.png`: Landscape 2.3:1 editorial business conference photograph, seated audience seen from behind, warm wood venue, softly blurred lit stage; no logos or text.
- `product-wrist.png`: Landscape 2.3:1 editorial close-up of a young adult's wrist wearing a vivid pink wristband and black jacket; no logos or text.

Pink and blue gallery examples use CSS hue changes to the hero. Colour previews are approximate. The generated photographs recreate the reference's subject and style; they are not the original source photographs.

## Verification

An isolated headless Chrome session checked category routing, image loading, 11 swatches, dropdown/swatch synchronization, quantity pricing, persisted cart contents, zoom dialog and mobile overflow. Desktop and mobile screenshots are in the ignored `.next-build/qa/` directory.
