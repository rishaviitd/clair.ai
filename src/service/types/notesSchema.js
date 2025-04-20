/**
 * Type definitions for the notes schema based on Google's Gemini API schema format
 */

// Enum for schema types (based on OpenAPI Data Types)
export const Type = {
  STRING: "string",
  INTEGER: "integer",
  NUMBER: "number",
  BOOLEAN: "boolean",
  ARRAY: "array",
  OBJECT: "object",
};

/**
 * Schema for the structured notes format returned by Gemini API
 * This follows the hierarchical structure of topics > subtopics > concepts
 */
export const notesStructureSchema = {
  type: Type.OBJECT,
  properties: {
    notes_structure: {
      type: Type.ARRAY,
      description: "Array of topics in the notes",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "Unique identifier for the topic",
            nullable: false,
          },
          name: {
            type: Type.STRING,
            description: "Name of the topic",
            nullable: false,
          },
          sub_items: {
            type: Type.ARRAY,
            description: "Array of subtopics",
            items: {
              type: Type.OBJECT,
              properties: {
                id: {
                  type: Type.STRING,
                  description: "Unique identifier for the subtopic",
                  nullable: false,
                },
                name: {
                  type: Type.STRING,
                  description: "Name of the subtopic",
                  nullable: false,
                },
                sub_items: {
                  type: Type.ARRAY,
                  description: "Array of concepts",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: {
                        type: Type.STRING,
                        description: "Unique identifier for the concept",
                        nullable: false,
                      },
                      name: {
                        type: Type.STRING,
                        description: "Name of the concept",
                        nullable: false,
                      },
                      definition: {
                        type: Type.STRING,
                        description: "Definition or explanation of the concept",
                      },
                      formulae: {
                        type: Type.ARRAY,
                        description:
                          "Array of mathematical formulae in LaTeX format",
                        items: {
                          type: Type.STRING,
                        },
                      },
                      examples: {
                        type: Type.ARRAY,
                        description:
                          "Array of examples or applications of the concept",
                        items: {
                          type: Type.STRING,
                        },
                      },
                      page_numbers: {
                        type: Type.ARRAY,
                        description:
                          "Array of page numbers where the concept appears",
                        items: {
                          type: Type.INTEGER,
                        },
                      },
                      source_note_line: {
                        type: Type.STRING,
                        description:
                          "The raw text from the notes where this concept was extracted",
                      },
                    },
                    required: ["id", "name"],
                    propertyOrdering: [
                      "id",
                      "name",
                      "definition",
                      "formulae",
                      "examples",
                      "page_numbers",
                      "source_note_line",
                    ],
                  },
                },
              },
              required: ["id", "name"],
              propertyOrdering: ["id", "name", "sub_items"],
            },
          },
        },
        required: ["id", "name"],
        propertyOrdering: ["id", "name", "sub_items"],
      },
    },
  },
  required: ["notes_structure"],
};
