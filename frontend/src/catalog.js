import products from "./data/products.json";

// Demo site: the catalogue ships with the website, so it never waits for the server.
export const allProducts = products;
export const newCollections = products.slice(-8);
export const popularInWomen = products.filter((p) => p.category === "women").slice(0, 4);
export const relatedTo = (category) => products.filter((p) => p.category === category).slice(0, 4);

// Product pictures live inside the website itself (public/images).
export const imgUrl = (path) => path;