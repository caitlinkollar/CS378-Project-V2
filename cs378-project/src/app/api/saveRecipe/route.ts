import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';

interface RecipeData {
  recipes: any[]; // Replace with better type
}

const BLOB_KEY = 'demo_recipes.json';
const BLOB_URL = 'https://hdmhdmqp368x8vik.public.blob.vercel-storage.com/demo_recipes.json';
const LOCAL_JSON_PATH = path.join(process.cwd(), 'demo_recipes.json');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const recipeJsonString = body.recipe;

    if (!recipeJsonString || typeof recipeJsonString !== 'string') {
      return NextResponse.json({ message: 'Invalid recipe data received' }, { status: 400 });
    }

    let newRecipeData;
    try {
      newRecipeData = JSON.parse(recipeJsonString);
    } catch (parseError) {
      return NextResponse.json({ message: 'Invalid JSON format' }, { status: 400 });
    }

    if (!Array.isArray(newRecipeData.recipes) || newRecipeData.recipes.length === 0) {
      return NextResponse.json({ message: 'Invalid recipe format' }, { status: 400 });
    }

    const newRecipe = newRecipeData.recipes[0];
    let existingRecipes: any[] = [];

    // Attempt to fetch the latest blob first
    try {
      const res = await fetch(BLOB_URL, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.recipes)) {
          existingRecipes = json.recipes;
        }
      } else {
        console.warn("Blob fetch failed, status:", res.status);
      }
    } catch (err) {
      console.warn("Blob fetch failed:", err);
    }

    // COMMENTED OUT BECAUSE I DON'T WANT TO USE THE LOCAL FILE
    // If blob is empty or errored, try local file
    // if (existingRecipes.length === 0) {
    //   try {
    //     const file = await fs.readFile(LOCAL_JSON_PATH, "utf-8");
    //     const fileData = JSON.parse(file);
    //     if (Array.isArray(fileData.recipes)) {
    //       existingRecipes = fileData.recipes;
    //     }
    //   } catch (err) {
    //     console.warn("Local file fallback failed:", err);
    //   }
    // }

    // Add new recipe
    existingRecipes.push(newRecipe);
    const updatedData: RecipeData = { recipes: existingRecipes };

    // COMMENTED OUT BECAUSE I DON'T WANT TO USE THE LOCAL FILE
    // Update local file
    // try {
    //   await fs.writeFile(LOCAL_JSON_PATH, JSON.stringify(updatedData, null, 2), "utf-8");
    //   console.log("Local file updated");
    // } catch (err) {
    //   console.warn("Failed to write local file:", err);
    // }

    // Upload to blob (overwrite)
    const { url } = await put(BLOB_KEY, JSON.stringify(updatedData, null, 2), {
      contentType: "application/json",
      access: "public",
      addRandomSuffix: false,
    });

    console.log("Blob uploaded:", url);

    return NextResponse.json({ message: "Recipe saved", url });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
