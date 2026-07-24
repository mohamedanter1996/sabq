// Development environment configuration
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  hubUrl: 'http://localhost:5000/hubs/sabq',
  adminDashboard: {
    refreshSeconds: 15
  },
  ads: {
    enabled: false,
    showPlaceholders: true,
    client: '',
    slots: {
      homeTop: '',
      questionsTop: '',
      questionsInFeed: '',
      questionDetail: '',
      resultsBottom: '',
      editorialArticle: ''
    }
  }
};
