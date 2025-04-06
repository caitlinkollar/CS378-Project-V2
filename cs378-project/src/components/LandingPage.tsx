"use client";
import { useEffect, useState } from "react";
import styles from "./LandingPage.module.css";
import AddRecipeModal from "./AddRecipeModal";

interface LandingPageProps {
  onSelectRecipe: (recipeName: string) => void;
}

interface DemoRecipe {
  name: string;
  ingredients: unknown;
  steps: unknown;
}

interface Recipe {
  recipeName: string;
}

const BLOB_URL = "https://hdmhdmqp368x8vik.public.blob.vercel-storage.com/demo_recipes.json"; // Replace with real blob URL

export default function LandingPage({ onSelectRecipe }: LandingPageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(BLOB_URL, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch blob");

        const data = await res.json();
        if (Array.isArray(data.recipes)) {
          const transformed: Recipe[] = data.recipes.map((r: DemoRecipe) => ({
            recipeName: r.name,
          }));
          setRecipes(transformed);
        }
      } catch (err) {
        console.error("Error fetching recipes from blob:", err);
      }
    };

    fetchRecipes();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>AL DENTE</h1>
      </div>
      <div className={styles.uploadPill} onClick={() => setShowModal(true)}>
        <span>Upload custom recipe</span>
        <span className={styles.arrow}>↑</span>
      </div>
      {showModal && <AddRecipeModal onClose={() => setShowModal(false)} />}
      <div className={styles.content}>
        {recipes.map((recipe) => {
          const formattedRecipe = recipe.recipeName.toLowerCase().replace(/\s+/g, "_");
          return (
            <button
              key={recipe.recipeName}
              className={styles.button}
              onClick={() => onSelectRecipe(recipe.recipeName)}
            >
              <div className={styles.imageWrapper}>
                <img
                  src={`./images/${formattedRecipe}/cover_photo.jpg`}
                  alt={recipe.recipeName}
                  className={styles.recipeImage}
                />
              </div>
              <span>{recipe.recipeName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
