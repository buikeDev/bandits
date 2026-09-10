# Custom wristband artwork

The preview toolbar offers 100%, 150% and 200% zoom and optional placement guides. Drag the selected logo's corner handle to resize while preserving its proportions. Undo and redo track the last 40 logo edits; a continuous drag or slider gesture counts as one edit. History covers artwork layers, not material, text or quantity changes. Editor guides and selection handles are excluded from order previews.

Customers can upload several PNG, JPG or WebP logos, including transparent PNGs, and add further files later. Each logo is an independent layer with an ID, name, embedded image, aspect ratio, size and position.

Select a logo on the preview or in the layer list. Drag it to move it, use the size and horizontal/vertical sliders, or nudge a focused logo with arrow keys (Shift for a larger step). Center, duplicate, remove, bring-to-front and send-to-back actions apply to the selected layer.

Size is a percentage of the largest aspect-preserving rectangle that fits the printable area. Horizontal and vertical positions run from 0 to 100 across the remaining travel area. The preview recalculates geometry for each material, keeping artwork inside the band without stretching it. Layers appear in array order, with the last layer on top.

The order stores `logos` with each custom design and uses the same artwork renderer as the editor. Legacy orders with a single `logo` remain supported. The optional array and its geometry are validated when loading saved orders.

Uploads are decoded before acceptance, limited to 2 MB per image and 3,000,000 encoded artwork characters per design. There is no fixed logo count. Browser storage can still fill across multiple orders; failed saves leave the current design intact and display an error. This remains a browser-saved order draft, not a submitted print order.

Verified in an isolated Chrome session: multiple PNG uploads, pointer dragging, resizing, aspect ratio, duplication, invalid-image rejection, material-boundary handling, saving and reloading logo placements in the order. TypeScript and ESLint checks also pass.
