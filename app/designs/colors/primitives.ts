import { type ThemeConfig } from "tailwindcss/types/config";

export const primitives = {
  "md-shade": {
    0: "#030E16",
    10: "#132534",
    20: "#1C354A",
    30: "#364C66",
    40: "#4F637D",
    50: "#6B7B93",
    60: "#8694A8",
    70: "#A3ADBE",
    80: "#C2C8D6",
    90: "#CFD4E2",
    95: "#DEE2ED",
    99: "#EEF1F7",
    100: "#F8F9FC",
  },
  "md-blue": {
    0: "#0F3657",
    10: "#113C5F",
    20: "#134267",
    30: "#164D76",
    40: "#1A5985",
    50: "#406C94",
    60: "#5D7FA3",
    70: "#7993B2",
    80: "#93A8C1",
    90: "#AEBDD0",
    95: "#C9D3E0",
    99: "#EAEFF5",
    100: "#F2F6FA",
  },
  "chad-blue": {
    0: "#32ABF2",
    10: "#37B0F6",
    20: "#3DB6FA",
    30: "#45BBFD",
    40: "#51C2FE",
    50: "#60C9FE",
    60: "#75D2FF",
    70: "#8EDCFF",
    80: "#ACE8FF",
    90: "#CFF3FF",
    95: "#E1F7FF",
    100: "#F2FCFF",
  },
  green: {
    0: "#47A823",
    10: "#5DB534",
    20: "#74C246",
    30: "#8CD05A",
    40: "#A3DB70",
    50: "#B7E586",
    60: "#C8EC9C",
    70: "#D6F2B2",
    80: "#E2F6C7",
    90: "#EDF8DC",
    95: "#F1F9E6",
    100: "#F6FAF0",
  },
  amber: {
    0: "#F29C07",
    10: "#F4A21E",
    20: "#F6A934",
    30: "#F8B14B",
    40: "#FAB963",
    50: "#FCC37A",
    60: "#FDCD92",
    70: "#FED7A9",
    80: "#FEE2C1",
    90: "#FFEDD8",
    95: "#FFF2E4",
    100: "#FFF8F0",
  },
  red: {
    0: "#D14545",
    10: "#D64949",
    20: "#DA4E4F",
    30: "#DF5656",
    40: "#E36061",
    50: "#E86D6E",
    60: "#ED7F80",
    70: "#F19697",
    80: "#F6B1B2",
    90: "#FAD1D1",
    95: "#FDE1E2",
    100: "#FFF2F2",
  },
  chart: {
    dark: {
      blue: "#1F9FEA",
      "navy-blue": "#1A3B60",
      orange: "#DE622B",
      wine: "#7E3E61",
      sand: "#EFBE57",
      denim: "#1F5B75",
      "forest-green": "#458251",
      lemon: "#7D8934",
    },
    base: {
      "navy-blue": "#1C4778",
      orange: "#E76F3A",
      wine: "#964270",
      sand: "#F6C96C",
      denim: "#206B8B",
      "forest-green": "#489858",
      lemon: "#B0C147",
    },
  },
} as const satisfies ThemeConfig["colors"];

export const std = {
  "pure-white": "#FFFFFF",
  white: primitives["md-shade"][100],
  "chad-blue": primitives["chad-blue"][0],
  red: primitives.red[0],
  black: primitives["md-shade"][0],
} as const satisfies ThemeConfig["colors"];