/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, GeneratedImage, PersonGeneration} from '@google/genai';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

// -------------------- CHOOSE AN IMAGEN MODEL -------------------------------------------------
const selectedModel = 'imagen-4.0-generate-001';
// const selectedModel = 'imagen-4.0-ultra-generate-001';
// const selectedModel = 'imagen-4.0-fast-generate-001';
// const selectedModel = 'imagen-3.0-generate-002';

// -------------------- BASE PROMPT -------------------------------------------------
const baseImagenPrompt = `A high-impact promotional image for a gym called 'Fight Zone 017'. The scene is set against a dark, textured gym background, like concrete gray or dark lead. The atmosphere is electrified by intense orange and cyan neon lighting that outlines the space and adds depth. The 'FIGHT ZONE 017' logo is featured prominently in the center: the text 'FIGHT ZONE' is rendered in a textured metallic silver/white, and the numbers '017' are in a vibrant red. In the foreground, there are powerful silhouettes of athletes in action: a Muay Thai athlete delivering a powerful kick and another athlete in a boxing guard pose with clenched fists. The composition is dynamic, captured from energetic angles to convey movement and intensity. Small, illuminated dust particles are suspended in the air, enhancing the dramatic atmosphere. The image focuses on strength, dedication, and the electrifying energy of the gym.`;

async function generateAndDisplayImages(prompt: string, aspectRatio: string) {
  const imageGallery = document.getElementById('image-gallery');
  if (!imageGallery) return;

  // Clear previous content and show loader
  imageGallery.innerHTML = '<div class="loader"></div>';

  try {
      const response = await ai.models.generateImages({
      model: selectedModel,
      prompt: prompt,
      config: {
          numberOfImages: 3,
          aspectRatio: aspectRatio,
          personGeneration: PersonGeneration.ALLOW_ADULT,
          outputMimeType: 'image/jpeg',
          includeRaiReason: true,
      },
      });
      // ===========================================================================================
      // numberOfImages - Valid values are 1-4, except for Imagen 4 Ultra, only 1 is valid.
      // aspectRatio - Default is 1:1, supported values are '1:1', '3:4', '4:3', '16:9', '9:16'
      // personGeneration - Allows more control over the generation of people, faces, and children.
      // outputMimeType -  API default is 'image/png', but 'image/jpeg' is often smaller (as strings)
      // includeRaiReason - Provides information on filtered output. The default is False
      // ===========================================================================================

      // -------------------- PREVIEW THE GENERATED IMAGES -----------------------------------------
      if (response?.generatedImages?.length) {
          // Clear loader
          imageGallery.innerHTML = '';
          response.generatedImages.forEach((generatedImage: GeneratedImage, index: number) => {
              if (generatedImage.image?.imageBytes) {
                  const src = `data:image/jpeg;base64,${generatedImage.image.imageBytes}`;
                  const img = new Image();
                  img.src = src;
                  img.alt = `${prompt.substring(0, 50)}... - Image ${Number(index) + 1}`;
                  // Styles applied via CSS (index.css #image-gallery img)
                  imageGallery.appendChild(img);
              }
          });
      } else {
        imageGallery.innerHTML = '<p class="error-message">No images were generated. Please try a different prompt or settings.</p>';
      }


      // -------------------- EXAMINE THE METADATA IN THE RESPONSE LOGS -----------------------------
      console.log('Full response:', response);

      if (response?.generatedImages) {
      console.log(`Number of generated images: ${response.generatedImages.length}`);
      response.generatedImages.forEach((generatedImage: GeneratedImage, index: number) => {
          console.log(`--- Image ${Number(index) + 1} ---`);
          if (generatedImage.image?.mimeType) {
          console.log(`MIME Type: ${generatedImage.image.mimeType}`);
          }
          if (generatedImage.raiFilteredReason) {
          console.log(`RAI Filtered Reason: ${generatedImage.raiFilteredReason}`);
          }
          if (generatedImage.safetyAttributes) {
          console.log('Safety Attributes:', generatedImage.safetyAttributes);
          }
      });
      }
  } catch (error) {
      console.error("Error generating images or processing response:", error);
      if (imageGallery) {
          // Clear loader
          imageGallery.innerHTML = '';
          // Create a paragraph element for the error message
          const errorParagraph = document.createElement('p');
          errorParagraph.textContent = 'Error: Could not load images. Check the console for details.';
          errorParagraph.className = 'error-message';
          imageGallery.appendChild(errorParagraph);
      }
  }
}

function regenerateImagesFromControls() {
    const aspectRatioSelect = document.getElementById('aspect-ratio-select') as HTMLSelectElement;
    const styleSelect = document.getElementById('style-select') as HTMLSelectElement;
    const qualitySelect = document.getElementById('quality-select') as HTMLSelectElement;
    const promptDisplay = document.getElementById('prompt-display');

    if (!aspectRatioSelect || !styleSelect || !qualitySelect || !promptDisplay) {
        console.error('One or more control elements are missing from the DOM.');
        return;
    }

    const aspectRatio = aspectRatioSelect.value;
    const style = styleSelect.value;
    const quality = qualitySelect.value;

    let finalPrompt = baseImagenPrompt;

    // Append style modifiers
    if (style === 'photorealistic') {
        finalPrompt += ', photorealistic style, hyperrealistic, 8k';
    } else if (style === 'cartoon') {
        finalPrompt += ', cartoon style, vibrant colors, clean lines';
    } else if (style === 'abstract') {
        finalPrompt += ', abstract art style, expressive brushstrokes';
    }

    // Append quality modifiers
    if (quality === 'high') {
        finalPrompt += ', high detail, sharp focus, intricate textures';
    }

    // Update the displayed prompt
    promptDisplay.textContent = `"${finalPrompt}"`;

    // Generate new images with the updated settings
    generateAndDisplayImages(finalPrompt, aspectRatio);
}


function initializeApp() {
    const aspectRatioSelect = document.getElementById('aspect-ratio-select');
    const styleSelect = document.getElementById('style-select');
    const qualitySelect = document.getElementById('quality-select');

    if (aspectRatioSelect && styleSelect && qualitySelect) {
        // Generate images on initial load
        regenerateImagesFromControls();

        // Add event listeners to regenerate images when any selection changes
        aspectRatioSelect.addEventListener('change', regenerateImagesFromControls);
        styleSelect.addEventListener('change', regenerateImagesFromControls);
        qualitySelect.addEventListener('change', regenerateImagesFromControls);
    } else {
        console.error('Control select elements not found. Cannot initialize app.');
        // Fallback to default if dropdowns aren't found
        const promptDisplay = document.getElementById('prompt-display');
        if(promptDisplay) promptDisplay.textContent = `"${baseImagenPrompt}"`;
        generateAndDisplayImages(baseImagenPrompt, '1:1');
    }
}

initializeApp();