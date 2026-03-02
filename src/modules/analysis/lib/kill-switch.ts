export const ANALYSIS_DISABLED = process.env.ANALYSIS_DISABLED === 'true';

export function checkKillSwitch() {
  if (ANALYSIS_DISABLED) {
    return {
      enabled: false,
      message: 'Analysis temporarily disabled'
    };
  }
  
  return {
    enabled: true,
    message: null
  };
}
