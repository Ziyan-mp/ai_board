# Drawing AI Dataset Specifications & Data Format

## 1. Purpose
The `datasets/drawing/` directory is structured to hold training, validation, and testing stroke data for fine-tuning our custom Drawing/Diagram AI recognition model. The goal is to classify freehand user drawings into digital geometric primitives.

## 2. Target Classes
The dataset initial layout supports 5 core geometric shape classes:
1. `circle`
2. `rectangle`
3. `triangle`
4. `line`
5. `arrow`

## 3. Data Format Specification
Data samples are stored as point-based JSON files collected directly from whiteboard pointer stroke events (`FreehandObject`).

### Sample JSON Structure
```json
{
  "label": "circle",
  "strokeWidth": 2,
  "points": [
    { "x": 10, "y": 20 },
    { "x": 12, "y": 21 },
    { "x": 15, "y": 25 }
  ]
}
```

## 4. Sample Guidelines & Naming Convention
- **Valid Sample Criteria**: A valid sample consists of a continuous or multi-stroke freehand drawing representing one of the 5 target classes. Samples should capture natural handwritten variation (varying speeds, aspect ratios, minor wobble, different start/end locations).
- **Naming Convention**: `<class>_<timestamp>_<sample_id>.json` (e.g. `circle_1726210000_a1b2c.json`).
- **Train / Validation / Test Split**:
  - **Train**: 70%
  - **Validation**: 15%
  - **Test**: 15%

> [!NOTE]
> Currently, drawing recognition uses a heuristic geometric rule-based baseline (`StrokeRecognizer.ts`). Custom ML model training and dataset population will occur during subsequent project phases.
