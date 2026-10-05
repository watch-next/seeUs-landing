// Adsterra integration configuration.
//
// `enabled` is the master switch for banner/native ads (components render nothing
// when false).
//
// `popunder` and `socialBar` are Experiment A feature switches. A real Adsterra
// script URL is required for each feature to activate — a script URL that is
// an empty string keeps the feature disabled. The script URL for each format
// comes from the Adsterra dashboard.
export interface AdsterraPopunderConfig {
  enabled: boolean
  /** Full Adsterra popunder script URL. Empty means the feature stays disabled. */
  scriptUrl: string
}

export interface AdsterraSocialBarConfig {
  enabled: boolean
  /** Full Adsterra Social Bar script URL. Empty means the feature stays disabled. */
  scriptUrl: string
}

export const adsterraConfig = {
  enabled: true,
  popunder: {
    enabled: true,
    scriptUrl: 'https://harryinspectionlucy.com/25/4d/5f/254d5feaa3247fc9bf1efe7a4ffcb016.js',
  } satisfies AdsterraPopunderConfig,
  socialBar: {
    enabled: true,
    scriptUrl: 'https://harryinspectionlucy.com/95/2c/2e/952c2e4192fe482b1cefceda5e624460.js',
  } satisfies AdsterraSocialBarConfig,
}