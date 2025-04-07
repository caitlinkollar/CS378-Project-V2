"use client";

import { useState, useEffect } from "react";
import RecipeStep from "../components/RecipeStep";
import Ingredients from "../components/Ingredients";
import StartRecipe from "../components/StartRecipe";
import LandingPage from "../components/LandingPage";
// import recipeData from "../../demo_recipes.json"; // <-- Remove this import
import styles from "../styles/page.module.css";

// Define interfaces for the recipe structure
interface Step {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  imageUrl?: string;
  timerDuration: number;
  demonstration?: string;
  helpfulTip?: string;
}

interface Recipe {
  name: string;
  serving_size: number;
  ingredients: unknown[]; // Keep as unknown or define more specific type if needed
  steps: Step[];
}

interface DemoRecipes {
  recipes: Recipe[];
}

const BLOB_URL = "https://hdmhdmqp368x8vik.public.blob.vercel-storage.com/demo_recipes.json"; // Blob URL

// Updated function to get steps from fetched data
const getRecipeSteps = (recipeName: string, allRecipesData: DemoRecipes | null): Step[] => {
  if (!allRecipesData) return [];
  const recipe = allRecipesData.recipes.find((r) => r.name === recipeName);
  return recipe ? recipe.steps : [];
};


export default function Home() {
  const [currentView, setCurrentView] = useState<"landing" | "start" | "ingredients" | "steps">("landing");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasStartedRecipe, setHasStartedRecipe] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<string>("");
  const [allRecipeData, setAllRecipeData] = useState<DemoRecipes | null>(null); // State for fetched data
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  // Fetch all recipe data from Blob on mount
  useEffect(() => {
    const fetchAllRecipes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(BLOB_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to fetch recipes (status: ${res.status})`);
        const data: DemoRecipes = await res.json();
        setAllRecipeData(data);
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllRecipes();
  }, []);

  // Load recipe steps dynamically based on fetched data
  const recipeSteps = getRecipeSteps(selectedRecipe, allRecipeData);
  const totalSteps = recipeSteps.length;
  const currentStep = recipeSteps[currentStepIndex];

  // Navigation handlers
  const goToIngredients = () => setCurrentView("ingredients");
  const goToStart = () => setCurrentView("start");
  const goToSteps = () => {
    setCurrentView("steps");
    setHasStartedRecipe(true);
  };
  const goToLanding = () => setCurrentView("landing");

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleNavigateHome = () => {
    // Navigate to home page
    setCurrentView("start");
  };

  const handleStepSelect = (stepNumber: number) => {
    // Navigate to specific step
    setCurrentStepIndex(stepNumber - 1); // If using state to track current step
  };

  const handleSelectRecipe = (recipeName: string) => {
    setSelectedRecipe(recipeName);
    setHasStartedRecipe(false);
    setCurrentStepIndex(0);
    // Don't reset timer states here, let the effect below handle it
    setCurrentView("start");
  }

  // In your parent component
  const [timerStates, setTimerStates] = useState<{
    [stepNumber: number]: {
      timeRemaining: number;
      isPaused: boolean;
      isActive: boolean;
    };
  }>({});

  // Initialize timer states based on fetched steps
  useEffect(() => {
    // Ensure data is loaded and a recipe is selected
    if (!allRecipeData || !selectedRecipe || isLoading) return;

    const currentRecipeSteps = getRecipeSteps(selectedRecipe, allRecipeData);
    if (!currentRecipeSteps) return; // No steps found for the recipe

    const initialTimerStates: {
      [key: number]: {
        timeRemaining: number;
        isPaused: boolean;
        isActive: boolean;
      };
    } = {};

    currentRecipeSteps.forEach((step, index) => {
      const durationInSeconds = (step.timerDuration || 0) * 60;
      initialTimerStates[index + 1] = {
        timeRemaining: durationInSeconds,
        isPaused: true, // Start timers paused
        isActive: durationInSeconds > 0
      };
    });
    setTimerStates(initialTimerStates);

  // Depend on fetched data, selected recipe, and loading state
  }, [selectedRecipe, allRecipeData, isLoading]);

  // Timer control functions (no change needed here, but ensure they use stepNumber correctly)
  const pauseTimer = (stepNumber: number) => {
    setTimerStates(prev => ({
      ...prev,
      [stepNumber]: {
        ...prev[stepNumber],
        isPaused: true
      }
    }));
  };

  const resumeTimer = (stepNumber: number) => {
    setTimerStates(prev => ({
      ...prev,
      [stepNumber]: {
        ...prev[stepNumber],
        isPaused: false
      }
    }));
  };

  const updateTimer = (stepNumber: number, newTime: number) => {
    setTimerStates(prev => ({
      ...prev,
      [stepNumber]: {
        ...prev[stepNumber],
        timeRemaining: newTime
      }
    }));
  };

  // Handle loading and error states for the main data fetch
  if (isLoading) {
    return <div className={styles.container}><p>Loading available recipes...</p></div>;
  }

  if (error) {
    return <div className={styles.container}><p>Error loading recipes: {error}</p></div>;
  }

  return (
    <div className={styles.container}>
      {currentView === "landing" && (
        // LandingPage already fetches its own list, so no need to pass allRecipeData
        <LandingPage onSelectRecipe={handleSelectRecipe} />
      )}
      {currentView === "start" && selectedRecipe && ( // Ensure selectedRecipe is truthy
        <StartRecipe
          onStart={goToSteps}
          onShowIngredients={goToIngredients}
          onBack={goToLanding}
          hasStarted={hasStartedRecipe}
          selected={selectedRecipe}
        />
      )}
      {currentView === "ingredients" && selectedRecipe && ( // Ensure selectedRecipe is truthy
        <Ingredients
          onContinueToInstructions={goToSteps}
          onBack={goToStart}
          selected={selectedRecipe} // Ingredients fetches its own data based on 'selected' prop
        />
      )}
      {currentView === "steps" && totalSteps > 0 && currentStep && timerStates[currentStepIndex + 1] && ( // Ensure currentStep and timerState exist
        <>
          <h1 className={styles.title}>{selectedRecipe}</h1>
          <div className={styles.stepWrapper}>
            <RecipeStep
              stepNumber={currentStepIndex + 1}
              totalSteps={totalSteps}
              title={currentStep.title}
              description={currentStep.description}
              imageUrl={currentStep.imageUrl ?? ''}
              timerDuration={currentStep.timerDuration} // Keep passing original duration if needed by RecipeStep
              demonstration={currentStep.demonstration ?? ''}
              helpfulTip={currentStep.helpfulTip ?? ''}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onNavigateHome={handleNavigateHome}
              onStepSelect={handleStepSelect}
              allStepTitles={recipeSteps.map((step) => step.title)}
              timerState={timerStates[currentStepIndex + 1]} // Pass the specific state for this step
              onPauseTimer={() => pauseTimer(currentStepIndex + 1)}
              onResumeTimer={() => resumeTimer(currentStepIndex + 1)}
              onUpdateTimer={(time) => updateTimer(currentStepIndex + 1, time)}
            />
          </div>
        </>
      )}
       {/* Optional: Handle case where steps view is selected but data isn't ready */}
       {currentView === "steps" && (isLoading || !currentStep) && (
         <p>Loading step details...</p>
       )}
       {/* Optional: Handle case where a view needs a selected recipe but it's missing */}
       {(currentView === "start" || currentView === "ingredients" || currentView === "steps") && !selectedRecipe && !isLoading && (
         <p>No recipe selected. Go back to <button onClick={goToLanding}>Landing</button>.</p>
       )}
    </div>
  );
}