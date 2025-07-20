import { z } from "zod";

import { runEvaluation } from "../eval.js";
import { templateInstructions, checkAgainstTrajectories } from "../eval.util.js";


runEvaluation(
    "gui",
    (data) => {
        return [
            {
                type: "image",
                data: Buffer.from(data.originalGUI.data).toString("base64"),
                path: data.originalGUI.path,
                size: Buffer.byteLength(data.originalGUI.data)
            }
        ];
    },
    (res, trajectories) => {
        return checkAgainstTrajectories(res, trajectories, (resElement, referenceElement) => {
            if(!referenceElement.bounding_box) return false;

            const TOLERANCE_OFFSET = 10;

            const x = referenceElement.bounding_box[0][0] - TOLERANCE_OFFSET;
            const y = referenceElement.bounding_box[0][1] + TOLERANCE_OFFSET;
            const w = referenceElement.bounding_box[1][0] - TOLERANCE_OFFSET;
            const h = referenceElement.bounding_box[1][1] + TOLERANCE_OFFSET;
            return (
                resElement.x >= x
                && resElement.x <= (x + w)
                && resElement.y >= y
                && resElement.y <= (y + h)
            );
        });
    },
    templateInstructions({
        SNAPSHOT_DESCRIPTION: "You are provided with a screenshot, namely the visually rendered GUI.",
        SCHEMA_DESCRIPTION: "Target elements by their spatial center pixel coordinates. This means, refer to them through an x (horizontal) and a y (vertical) pixel coordinate relative to the origin, which is in the top left corner of the image and increases to the bottom right.",
        EXAMPLE_SNAPSHOT: `
\`\`\` base64
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAACWCAMAAACsAjcrAAAACXBIWXMAADsOAAA7DgHMtqGDAAACwVBMVEXu7u69vb2np6ecnJybm5uoqKiYmJh/f3+Pj4+fn5/U1NT////29vaqqqr39/fj4+Pl5eX6+vrS0tKwsLD7+/vx8fHy8vK2tra3t7fm5ubZ2dnd3d3k5OTp6em6urqurq67u7vw8PD8/PzLy8u0tLSsrKzKysr+/v65ubmzs7OxsbG8vLzn5+fJycmtra3s7Oy+vr6vr6+/v7/Hx8fr6+uysrLBwcHQ0NDz8/Pv7+/Pz8/Ozs6rq6v09PTh4eHg4ODR0dG4uLj5+fnNzc3Dw8Pa2tri4uLX19fMzMzY2NjV1dXf39/t7e39/f3CwsLW1tbFxcXc3Nzq6urb29vAwMDe3t7o6Oj4+Pj19fXT09O1tbXIyMhhXsctK8QuK8lfXdbBwO/l5Pj5+f7x8fvX1vWmpehPTNHPzvPS0fOGhOD+/v/r6vpKR9Dz8/zw8PuDgd9EQc+KiOGjoudNS9GeneaOjOKLieFnZNhRT9LGxvDq6fn7+/7r6/rMy/JdWtXT0vTo6PnV1fTd3fZmZNfU0/Tv7/v4+P3g3/d+fN49Os38/P7i4vhradlkYtf9/f76+v5zcduQj+JaWNSameVxb9rU1PS5uO39/f94dty3tuz08/zLyvFLSNDd3Pbn5/k1MstDQc+bmuWPjeIxLsrOzfKQjuIwLcnh4fdIRtBHRdCioOeVlORXVdSNi+I6N8xgXtZ5d9yko+fJyPFqaNiHheBGQ88+O81/fd7W1fQ8Oc1oZtiFg996eN11c9tCQM6IhuCEgt/DwvDv7vuzsuuXleRQTtLIx/G+ve5MSdGTkePY2PVeXNWUkuPp6fmCgd9HRM9vbdq0s+xBPs7Cwe90ctve3vc5N8xwbtqqqemZmOXy8vzf3/exsOtSUNJVUtNWVNO/vu719fynpugqJ8IdGaoPDJMcGakpJsAtKccrKZ+KiMWTmbCgAAAFdUlEQVR4nO2Z+V8UZRzHWQ45vjwsy3LE5RK4YLAQoiDKwC5XICYekZXKk1ARkZFHWUGXR2CgdBKWlCRmdhmVlVmRWpFZdtt9ewV/Rc8zw+4MvQoXGZiBvu8flu939zPwffM8M6OMhweCIAiCIAiCIAiCIAiCIAiCTCgMnl7u4T3++Bjc95ji6+evW/x8p7i9Hr4BoGMCfN1dEx8/rWcdHj9PN0W8/bUedXj8vVBEX6CI3vjfiwQSF0FjPaORBJ87dL4iphCG2cxfQ8dofhdhIeHnDvl7j2JrRVyg/tTny+hFIkkUr6NJjJHEBky1xF3IuviEadZpifHOoLNNmn4Rey80OQXkbDCxpaZdrDjCmG6ekRGlKMStFZrKPp9p4j9vVlRKmiFSdRHIjOOvWeakYBIxO3tOhJntNYN1rjFHSHEGXW24NQQgJy0X5KyNpKfmBcoRI0m05yWQPGXBRKYLjpgAc34SyxscBXMMlgLVRRyEbWGTtZANV8TaGFIMlxC7uEhGKadoS6y54UIxKLJssCGR0jR+yDxFwUXspIw1eSzFxFk1n8SqLpJNHHyES9lwfEPEk1QoFBbwSsiRcso2pTyDDy5nbaRkSCSELFwgHuUquEgpCWRVKCll+XnAN5hddREwZLKdFcGHy+OtJQuKBq/Mi6Scss0lQiAoszYyf0jEVCRYDY4wkAsuUi6I38lSzvJcQTpKZZHFZIlJWMiHsztFrDYRj0ERRXsZIdGgzEqDKSNBZRWCsEQuRBHrOIiw8yOar7xzuyRCDhlyKiraQMuiLEuQMisN9o8jgswVciFtLXbBYlurcCxFYGZmRoX4W84CfgJfDksJ/+9kWGqu9LmizbJccSVbBkVWGkyOzC7mh6THyQUXiRTPDDtZOqYiNsIG4sNllNkiI8zsZpBOcoyO5HznjcTV2vm+imKjyFlpMDkSYo2y2UqEALkQL79xwlWRxmQDjKkIZFrjRZHgsqlp0g2xdJk1f3m2M+hsC5IzeBs3o0DODoq4jkhKsBJz+mJFIYqY+A0xIX5sRFwsWw6iiHGYzFBGknULVUSiyKyRDqediNd/isQ6LEUjHk6PIsmZcwtGPJweRfQBiugNFNEbbot46v2P2D5uikyaxwqT5kEPWxMfDZ6pufm0z3MEj94QBEEQBEEQBJm8rKikqlG5QkMP9TQ42pmouB6cSs1E1PWgFEVQBEVQZLxFrl5ZVX3NtdfVDH33eqidYCI31El/nr1x1QQXuQnqb15dswZg7cQWWQdwC/966/rb2OvtdzQ03nnX3YMi98C9/KMNsJHSTZvva2reomOR+1ugdauz2VYNbRsfgLYHJZGHAB6mdHUdPEIfbYP2xzrqtutXhD7Ozo8ndqzp5PWT0LCOrmqFp3aKIl1t8DSlu6CuprsKdlP6DDTrWGTP+mfFk719L30O4Hn2zgsAL0rnyG7YQOkO2ExrAF6idB/Ay/oVYXT2vNIM8Cp9DWA/a3sAtksi7BLw+hstsItudT56elPXIozuA1D31kGAt1n9DsC7kkhvC7x3CFq6uOLhtZxNuhXZX3tkL//6PkBvr3QF+wDgw8HLbx98tBL6KD0K8PG//wZ0I7IF4FhP1yeftsFxfk4cP0o7q+CA8z5yCBrq4TNWHIPWz+kXfV9+pVuRPV8P7v6Wb9i/Vqqh8UQLNG5ziuxrAqj+lhXfdUDTiQ74Xr8rQnf+cATgx59+/oU3v/Y1NDb0/UZdd/bDAL+LsYPt9X/U/tmtY5FRgiIogiI6FTmprsdJzUROqStySjOR02fO/qUaZ8+c1k5EZTQT6VfXo18zkQF1RQY0E/EYUHFN+jX0QBAEQRAEQRAEQRAEQRAEQRAEQRBk0vE3B0QJ1P67O3YAAAAASUVORK5CYII=
\`\`\`
        `,
        EXAMPLE_RESPONSE: `
\`\`\` json
[
    {
        "elementDescription": "Field that contains the search query.",
        "x": 100,
        "y": 47
    },
    {
        "elementDescription": "Button that submits the search query.",
        "x": 100,
        "y": 197
    }
]
\`\`\`        
        `,
    }),
    z.object({
        x: z.number(),
        y: z.number()
    })
);