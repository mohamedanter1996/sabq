// Production environment configuration
export const environment = {
  production: true,
  apiUrl: 'https://sabiqgameapi.runasp.net/api',
  hubUrl: 'https://sabiqgameapi.runasp.net/hubs/sabq',
  adminDashboard: {
    refreshSeconds: 15
  },
  ads: {
    enabled: false,
    showPlaceholders: false,
    client: '',
    slots: {
      homeTop: '',
      questionsTop: '',
      questionsInFeed: '',
      questionDetail: '',
      resultsBottom: ''
    }
  }
};
