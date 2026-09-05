/**
 * generate-rich-menus.mjs — replaces the demo restaurants' menus with large,
 * realistic menus (50-100 items) so the navigation/search experience can be
 * evaluated at real scale. Idempotent: run any time to regenerate.
 *   node scripts/generate-rich-menus.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

// Compact dish format: [name, description, price, tags, spice, featured?]
// tags: "" | "v" (vegetarian) | "vg" (vegan) | "gf" (gluten-free) | combos like "v gf"
const ITALIAN = {
    "Antipasti": [
        ["Bruschetta al Pomodoro", "Grilled sourdough, marinated San Marzano tomatoes, basil, Sicilian olive oil", 9, "v", 0, true],
        ["Burrata Pugliese", "Creamy burrata, heirloom tomatoes, aged balsamic, basil oil", 16, "v gf", 0, true],
        ["Vitello Tonnato", "Thin-sliced veal, tuna-caper cream, lemon, arugula", 17, "gf", 0],
        ["Carpaccio di Manzo", "Beef carpaccio, wild rocket, Parmigiano-Reggiano, truffle oil", 18, "gf", 0],
        ["Arancini ai Funghi", "Crispy saffron risotto spheres, porcini, taleggio center", 12, "v", 0],
        ["Polpette della Nonna", "Slow-braised beef meatballs, San Marzano sugo, whipped ricotta", 14, "", 0],
        ["Calamari Fritti", "Lightly floured calamari, lemon aioli, marinara", 15, "", 0],
        ["Prosciutto e Melone", "24-month Parma ham, cantaloupe, fig mostarda", 16, "gf", 0],
        ["Caprese di Bufala", "Buffalo mozzarella, vine tomatoes, basil, Ligurian oil", 14, "v gf", 0],
        ["Gamberi all'Aglio", "Sautéed prawns, garlic, white wine, chili, crostini", 17, "", 1],
    ],
    "Insalate": [
        ["Cesare Classica", "Baby gem, pecorino crisp, white anchovy, sourdough croutons", 13, "v", 0],
        ["Insalata Tricolore", "Endive, radicchio, arugula, aged balsamic, shaved Parmigiano", 12, "v gf", 0],
        ["Panzerotti Salad", "Warm farro, roasted squash, kale, hazelnut, ricotta salata", 15, "v", 0],
        ["Pollo Grigliato", "Charred chicken breast, little gems, Caesar dressing, focaccia crumb", 17, "", 0],
        ["Gambero e Avocado", "Prawns, avocado, grapefruit, fennel, citrus dressing", 18, "gf", 0],
        ["Burrata e Pesca", "Burrata, grilled peach, prosciutto crisp, saba", 16, "v gf", 0],
    ],
    "Primi": [
        ["Tagliatelle al Ragù Bolognese", "Hand-cut egg pasta, 8-hour beef and pork ragù", 22, "", 0, true],
        ["Spaghetti alle Vongole", "Clams, white wine, garlic, chili, parsley", 24, "", 1],
        ["Cacio e Pepe", "Bronze-cut tonnarelli, Pecorino Romano, cracked Sarawak pepper", 18, "v", 0],
        ["Carbonara Romana", "Guanciale, egg yolk, Pecorino Romano, black pepper", 20, "", 0],
        ["Linguine ai Frutti di Mare", "Mussels, clams, prawns, calamari, cherry tomato", 28, "", 1],
        ["Ravioli di Ricotta e Spinaci", "Hand-folded ravioli, sage butter, Parmigiano", 19, "v", 0],
        ["Gnocchi al Tartufo", "Potato gnocchi, porcini cream, shaved black truffle", 24, "v", 0],
        ["Risotto ai Funghi Porcini", "Carnaroli rice, porcini, thyme, aged Parmigiano", 23, "v gf", 0],
        ["Pappardelle al Cinghiale", "Wide ribbons, slow-braised wild boar, juniper", 26, "", 0],
        ["Lasagne Verde al Forno", "Spinach pasta layers, ragù, besciamella, Parmigiano", 21, "", 0],
        ["Agnolotti del Plin", "Piedmontese meat agnolotti, roast gravy, sage", 25, "", 0],
        ["Fettuccine Alfredo", "Silk fettuccine, cultured butter, Parmigiano, cracked pepper", 19, "v", 0],
    ],
    "Pizza": [
        ["Margherita D.O.P.", "San Marzano, fior di latte, basil, Sicilian olive oil", 14, "v", 0, true],
        ["Marinara Verace", "Tomato, garlic, oregano, olive oil — no cheese, the original", 12, "vg", 0],
        ["Diavola", "Spicy soppressata, tomato, fior di latte, calabrian chili honey", 17, "", 2, true],
        ["Quattro Formaggi", "Gorgonzola, taleggio, fontina, Parmigiano, walnut honey", 18, "v", 0],
        ["Prosciutto e Rucola", "Parma ham, wild arugula, cherry tomato, shaved Parmigiano", 19, "", 0],
        ["Tartufo Nero", "Black truffle cream, fior di latte, wild mushrooms, thyme", 22, "v", 0],
        ["Capricciosa", "Ham, artichoke, black olive, mushroom, egg", 18, "", 0],
        ["Ortolana", "Grilled zucchini, eggplant, pepper, basil pesto", 17, "v", 0],
        ["Salsiccia e Friarielli", "Fennel sausage, broccoli rabe, smoked scamorza", 19, "", 1],
        ["Burrata e Pistacchio", "Pistachio pesto, burrata, mortadella, lemon zest", 21, "", 0],
        ["Nduja e Miele", "Spicy Calabrian 'nduja, hot honey, fior di latte", 18, "", 2],
        ["Margherita Gluten-Free", "Same soul, certified GF crust", 15, "v gf", 0],
    ],
    "Secondi": [
        ["Branzino al Forno", "Whole roasted sea bass, fennel, lemon, salmoriglio", 34, "gf", 0, true],
        ["Osso Buco alla Milanese", "Braised veal shank, saffron risotto, gremolata", 38, "gf", 0],
        ["Bistecca Fiorentina", "1kg dry-aged T-bone, rosemary, Tuscan salt — for two", 78, "gf", 0],
        ["Saltimbocca alla Romana", "Veal, prosciutto, sage, white wine butter", 32, "gf", 0],
        ["Pollo al Mattone", "Brick-pressed chicken, charred lemon, rosemary jus", 28, "gf", 0],
        ["Branzino in Crosta di Sale", "Salt-crusted sea bass, herb oil — carve at table", 36, "gf", 0],
        ["Melanzane alla Parmigiana", "Layered eggplant, tomato, basil, fior di latte", 22, "v", 0],
        ["Dorado alla Griglia", "Grilled sea bream, caponata, almond gremolata", 33, "gf", 0],
        ["Agnello Scottadito", "Grilled lamb chops, salsa verde, burnt lemon", 36, "gf", 0],
        ["Cotoletta alla Milanese", "Butterflied veal cutlet, herb butter, fried sage", 31, "", 0],
    ],
    "Contorni": [
        ["Patate al Rosmarino", "Crispy rosemary potatoes, sea salt", 8, "v gf", 0],
        ["Friarielli Saltati", "Sautéed broccoli rabe, garlic, chili", 9, "vg gf", 1],
        ["Insalata Mista", "Seasonal leaves, shaved vegetables, red wine vinaigrette", 7, "v gf", 0],
        ["Zucchine alla Scapece", "Marinated fried zucchini, mint, vinegar", 8, "v", 0],
        ["Funghi Trifolati", "Wild mushrooms, garlic, parsley", 10, "vg gf", 0],
    ],
    "Dolci": [
        ["Tiramisù Classico", "Savoiardi, mascarpone, espresso, Valrhona cocoa", 11, "v", 0, true],
        ["Panna Cotta al Vaniglia", "Tahitian vanilla, macerated berries", 10, "v gf", 0],
        ["Cannoli Siciliani", "Ricotta, candied orange, pistachio, chocolate", 10, "v", 0],
        ["Affogato al Caffè", "Fior di latte gelato drowned in double espresso", 9, "v gf", 0],
        ["Torta della Nonna", "Custard tart, pine nuts, lemon", 10, "v", 0],
        ["Gelato Artigianale", "Three scoops — ask for today's flavors", 8, "v", 0],
        ["Zabaglione con Frutti di Bosco", "Warm sabayon, wild berries", 11, "v gf", 0],
        ["Bomboloni", "Sugar-dusted doughnuts, pastry cream", 9, "v", 0],
    ],
    "Bevande": [
        ["Espresso", "Single-origin, roasted in Torino", 3.5, "v", 0],
        ["Cappuccino", "Velvet-steamed milk, cocoa dust", 5, "v", 0],
        ["Limonata della Casa", "Amalfi lemon, mint, sparkling", 6, "vg", 0],
        ["Aranciata Rossa", "Blood orange, lightly sparkling", 6, "vg", 0],
        ["San Pellegrino 750ml", "Sparkling mineral water", 6, "vg", 0],
        ["Chinò", "The classic Italian cola, over ice", 5, "vg", 0],
        ["Espresso Martini", "Vodka, espresso, coffee liqueur", 14, "v", 0],
        ["Negroni Sbagliato", "Campari, sweet vermouth, prosecco", 14, "v", 0],
        ["Aperol Spritz", "Aperol, prosecco, soda, olives", 13, "vg", 0],
    ],
};

const BURGER = {
    "Signature Burgers": [
        ["The OG Smash", "Double smashed patties, American cheese, pickles, house sauce, potato bun", 13, "", 0, true],
        ["Nuclear Nacho", "Double patty, queso, jalapeño relish, corn chips, chipotle mayo", 15, "", 2],
        ["Truffle Shuffle", "6oz patty, truffle mayo, aged cheddar, caramelized onion, rocket", 17, "", 0],
        ["Hot Honey Bird", "Buttermilk fried chicken, hot honey, slaw, pickles", 15, "", 2, true],
        ["Blue Collar", "Double patty, blue cheese, bacon jam, crispy onions", 16, "", 0],
        ["Mushroom Melt", "Portobello, swiss, garlic aioli, fried shallots", 14, "v", 0],
        ["The Vegan Vigilante", "Beyond patty, vegan cheddar, lettuce, tomato, vegan secret sauce", 15, "vg", 0],
        ["Ghost Pepper Challenge", "Double patty, ghost pepper jack, habanero relish — sign the waiver", 17, "", 3],
        ["Breakfast All Night", "Patty, fried egg, bacon, maple aioli, hashbrown stack", 15, "", 0],
        ["Korean Street", "Gochujang glaze, kimchi slaw, sesame mayo, scallion", 16, "", 2],
        ["Patty Melt Deluxe", "Rye bread, swiss, thousand island, griddled onions", 14, "", 0],
        ["Buffalo Blue", "Fried chicken, buffalo sauce, blue cheese ranch, celery slaw", 15, "", 2],
        ["The Big Neon", "Triple patty, triple cheese, double sauce — the photo op", 19, "", 0, true],
        ["Surf & Smash", "Patty, crispy shrimp, tiger sauce, lettuce", 18, "", 0],
        ["El Fuego", "Chorizo-blend patty, pepper jack, salsa verde, crispy jalapeños", 16, "", 3],
        ["Classic Cheese", "Single patty, American, pickles, onion, mustard", 9, "", 0],
    ],
    "Loaded Sides": [
        ["Neon Fries", "Double-fried, smoked salt, house seasoning", 5, "vg", 0, true],
        ["Cheese Fries", "Fries, queso, scallion", 7, "v", 0],
        ["Truffle Parm Fries", "Truffle oil, Parmigiano, chive", 8, "v", 0],
        ["Chili Cheese Fries", "Beef chili, queso, pickled jalapeño", 9, "", 2],
        ["Loaded Nachos", "Queso, pico, guac, sour cream, jalapeño", 11, "v", 1],
        ["Onion Blossom", "Hand-battered onion rings, burger sauce", 7, "v", 0],
        ["Mac & Cheese Bites", "Crumbed cheddar mac, ranch dip", 8, "v", 0],
        ["Sweet Potato Fries", "Cinnamon dust, maple dip", 6, "vg", 0],
        ["Coleslaw", "Napa cabbage, buttermilk dressing", 4, "v", 0],
        ["Pickle Chips", "Beer-battered dill chips, ranch", 6, "v", 0],
    ],
    "Wings": [
        ["Classic Buffalo", "Six wings, buffalo, blue cheese dip", 12, "", 2, true],
        ["Korean Gochujang", "Sticky-sweet, sesame, scallion", 13, "", 2],
        ["Lemon Pepper Dry Rub", "Dry-rubbed, no sauce, all crunch", 12, "", 0],
        ["Honey Garlic", "Sticky honey-garlic glaze, sesame", 12, "", 0],
        ["Nuclear Wings", "Carolina reaper sauce — six wings of regret", 14, "", 3],
        ["BBQ Bourbon", "Smoky bourbon BBQ, pickles", 13, "", 0],
    ],
    "Shakes & Floats": [
        ["Classic Vanilla Bean", "Madagascar vanilla, malted crumble", 7, "v", 0],
        ["Salted Caramel", "House caramel, flaked salt, whipped cream", 8, "v", 0, true],
        ["Dark Chocolate", "70% chocolate, chocolate shavings", 8, "v", 0],
        ["Strawberry Cheesecake", "Fresh strawberry, cheesecake chunks", 8, "v", 0],
        ["Oreo Overload", "Cookies, cookie crumble rim", 8, "v", 0],
        ["Espresso Buzz", "Double shot, coffee ice cream", 8, "v", 0],
        ["Matcha Machine", "Ceremonial matcha, vanilla soft serve", 9, "v", 0],
        ["Root Beer Float", "Craft root beer, vanilla ice cream", 7, "v", 0],
    ],
    "Drinks": [
        ["Fountain Soda", "Free refills", 3, "vg", 0],
        ["Fresh Lemonade", "Hand-pressed, mint", 5, "vg", 0],
        ["Craft Cola", "Small-batch cola, cane sugar", 4, "vg", 0],
        ["Cherry Limeade", "Fresh lime, maraschino", 5, "vg", 0],
        ["Iced Tea", "Peach or unsweetened", 3.5, "vg", 0],
        ["Bottled Water", "Still or sparkling", 3, "vg", 0],
        ["Milk", "Whole or oat", 3, "v", 0],
        ["Cold Brew", "16-hour steep", 5, "vg", 0],
        ["House Lemonade Slush", "Frozen, extra sour", 6, "vg", 0],
    ],
    "Combos": [
        ["Smash Combo", "The OG Smash + fries + drink", 18, "", 0],
        ["Chicken Combo", "Hot Honey Bird + fries + drink", 20, "", 2],
        ["Wing Night", "12 wings + fries + two drinks", 29, "", 2],
        ["Date Night", "Two burgers + loaded fries + two shakes", 42, "", 0],
        ["Solo Street", "Any burger + slaw + fountain", 16, "", 0],
        ["Family Feast", "4 burgers + 2 fries + onion rings + 4 drinks", 59, "", 0],
    ],
    "Desserts": [
        ["Warm Cookie Skillet", "Chocolate chip, vanilla soft serve", 8, "v", 0],
        ["Fried Apple Pie", "Cinnamon sugar, salted caramel", 7, "v", 0],
        ["Churros", "Cinnamon sugar, chocolate dip", 6, "v", 0],
    ],
};

const MATCHA = {
    "Signature Matcha": [
        ["Ceremonial Iced Matcha", "First-harvest Uji matcha, spring water, no sweetener", 6.5, "vg", 0, true],
        ["Matcha Latte", "Stone-milled matcha, your choice of milk, lightly sweet", 6, "v", 0, true],
        ["Strawberry Matcha Cloud", "Fresh strawberry puree, oat milk, ceremonial matcha", 7.5, "vg", 0, true],
        ["Hojicha Roast Latte", "Roasted green tea, caramel notes, steamed milk", 6, "v", 0],
        ["Matcha Espresso Fusion", "Dirty matcha — ceremonial matcha under a double shot", 7, "v", 0],
        ["Coconut Matcha Cooler", "Coconut water, lime, matcha, mint", 7, "vg", 0],
        ["Matcha Affogato", "Vanilla soft serve, matcha shot, mochi", 8, "v gf", 0],
        ["Genmaicha Latte", "Poppy roasted rice tea, oat milk", 6, "vg", 0],
        ["Matcha Fizz", "Yuzu, sparkling water, matcha foam", 7, "vg", 0],
        ["Brown Sugar Matcha", "Caramelized brown sugar, milk, matcha", 7, "v", 0],
        ["Iced Sencha", "Cold-brewed spring sencha, clean and grassy", 5, "vg", 0],
        ["Matcha Cream Top", "Cold brew coffee crowned with sweet matcha cream", 7, "v", 0],
    ],
    "Coffee Bar": [
        ["Espresso", "Seasonal single origin", 3.5, "vg", 0],
        ["Flat White", "Velvet micro-foam, double ristretto", 5, "v", 0],
        ["Cortado", "Equal parts espresso and warm milk", 4.5, "v", 0],
        ["Pour Over V60", "Single-origin, rotating roast", 6, "vg", 0],
        ["Oat Latte", "Barista oat milk, double shot", 5.5, "vg", 0],
        ["Honey Lavender Latte", "House lavender syrup, local honey", 6.5, "v", 0],
        ["Cold Brew", "16-hour slow steep, chocolatey", 5.5, "vg", 0],
        ["Mocha Noir", "70% dark chocolate, espresso, milk", 6, "v", 0],
    ],
    "Tea House": [
        ["Gyokuro", "Shade-grown jewel of Japanese tea", 9, "vg", 0],
        ["Sencha", "Steamed, grassy, classic", 5, "vg", 0],
        ["Jasmine Pearl", "Hand-rolled, delicately perfumed", 6, "vg", 0],
        ["Oolong Tieguanyin", "Floral, creamy, multiple infusions", 7, "vg", 0],
        ["Yuzu Herbal", "Caffeine-free citrus calm", 5.5, "vg", 0],
        ["Roasted Barley (Mugicha)", "Nutty, served cold", 4.5, "vg", 0],
    ],
    "Bakery": [
        ["Matcha Basque Cheesecake", "Burnt top, molten center", 8, "v", 0, true],
        ["Yuzu Tart", "Citrus curd, torched meringue", 7, "v", 0],
        ["Hoji cheesecake Jar", "Roasted-tea cheesecake, biscuit crumb", 7.5, "v", 0],
        ["Matcha Roll Cake", "Sponge, whipped matcha cream", 7, "v", 0],
        ["Black Sesame Croissant", "Laminated, sesame frangipane", 5.5, "v", 0],
        ["Mochi Muffin", "Chewy rice flour, black sesame", 4.5, "v gf", 0],
        ["Butter Mochi Loaf Slice", "Coconut, golden edges", 4, "v gf", 0],
        ["Melonpan", "Cookie-crust brioche", 4.5, "v", 0],
        ["Anko Danish", "Red bean, laminated pastry", 5, "v", 0],
        ["Matcha Cookie", "White chocolate chunks, sea salt", 3.5, "v", 0],
    ],
    "All-Day Brunch": [
        ["Matcha Pancake Stack", "Three buttermilk pancakes, matcha cream, berries", 14, "v", 0, true],
        ["Shokupan Toast", "Thick-cut milk bread, whipped butter, honey", 8, "v", 0],
        ["Tamago Sando", "Japanese egg salad, milk bread, chive", 10, "v", 0],
        ["Katsu Sando", "Panko pork cutlet, tonkatsu sauce, cabbage", 14, "", 0],
        ["Smoked Salmon Toast", "Sourdough, cream cheese, cucumber, dill", 13, "", 0],
        ["Avocado Rice Bowl", "Brown rice, avocado, edamame, sesame", 12, "vg", 0],
        ["Miso Mushroom Bowl", "Grilled mushrooms, miso butter, rice, egg", 13, "v", 0],
        ["Chia Parfait", "Matcha chia, coconut yogurt, granola", 9, "vg", 0],
        ["Onigiri Duo", "Two rice triangles — salmon or umeboshi", 8, "vg", 0],
        ["Soft Serve Duo", "Matcha + hojicha twist, mochi topping", 6.5, "v", 0],
    ],
    "Nourish Bowls": [
        ["Salmon Poke Bowl", "Soy-sesame salmon, sushi rice, edamame, avocado", 17, "gf", 0],
        ["Tofu Teriyaki Bowl", "Crispy tofu, teriyaki, pickles, rice", 14, "vg", 0],
        ["Chicken Katsu Bowl", "Panko chicken, curry drizzle, slaw", 16, "", 0],
        ["Veggie Rainbow Bowl", "Six vegetables, tahini-ginger dressing", 13, "vg gf", 0],
        ["Beef Bulgogi Bowl", "Marinated ribeye, kimchi, fried egg", 18, "", 1],
        ["Tuna Tataki Bowl", "Seared tuna, ponzu, wakame, radish", 19, "gf", 0],
    ],
    "Something Sweet": [
        ["Matcha Soft Serve", "Single swirl, waffle crisp", 5.5, "v", 0],
        ["Warabi Mochi", "Bracken-starch jelly, roasted soybean flour", 6, "vg gf", 0],
        ["Dorayaki", "Fluffy pancake sandwich, red bean", 5.5, "v", 0],
        ["Matcha Tiramisu", "Layered, lightly bitter, cream", 8, "v", 0],
        ["Yuzu Sorbet", "Dairy-free, intensely citrus", 5, "vg", 0],
        ["Mille Crepe Slice", "Twenty layers, matcha cream", 7.5, "v", 0],
    ],
};

function slugify(name) {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

const TAG_MAP = {
    "": [],
    v: ["vegetarian"],
    vg: ["vegan"],
    gf: ["gluten-free"],
    "v gf": ["vegetarian", "gluten-free"],
    "vg gf": ["vegan", "gluten-free"],
    "vg": ["vegan"],
};

function buildItems(dishes, idPrefix) {
    const seen = new Set();
    return dishes.map(([name, desc, price, tags, spicy, featured]) => {
        let id = slugify(name);
        while (seen.has(id)) id = id + "-2";
        seen.add(id);
        const item = {
            id,
            name,
            description: desc,
            price,
            tags: TAG_MAP[tags] ?? [],
            spicyLevel: spicy,
            available: true,
            featured: !!featured,
        };
        return item;
    });
}

const MENUS = {
    "bella-italia": ITALIAN,
    "neon-burger": BURGER,
    "matcha-minimal": MATCHA,
};

async function main() {
    const base = path.join(process.cwd(), "restaurants");
    for (const [slug, categories] of Object.entries(MENUS)) {
        const configPath = path.join(base, slug, "config.json");
        const config = JSON.parse(await fs.readFile(configPath, "utf-8"));

        const catIndex = new Map(
            (config.menu || []).map((c) => [c.id, c])
        );

        const newMenu = [];
        for (const [catName, dishes] of Object.entries(categories)) {
            const id = slugify(catName);
            const existing = catIndex.get(id);
            newMenu.push({
                id,
                name: catName,
                description:
                    existing?.description ||
                    `${dishes.length} dishes, prepared to order`,
                items: buildItems(dishes, id),
            });
        }

        config.menu = newMenu;
        const total = newMenu.reduce((n, c) => n + c.items.length, 0);
        await fs.writeFile(configPath, JSON.stringify(config, null, 2) + "\n");
        console.log(`✅ ${slug}: ${newMenu.length} categories, ${total} items`);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});