# Kilwa Dashboard

A modern web-based dashboard for monitoring and analyzing sentiment analysis model performance. This dashboard displays metrics for FinBERT and VADER+TextBlob models, with manual upload capabilities for different stages of the Kilwa data processing pipeline.

## Features

### 📊 Model Performance Metrics
- **FinBERT Model Metrics**: Display accuracy, precision, recall, and F1 score
- **VADER + TextBlob Metrics**: Display combined sentiment analysis metrics
- **Sentiment Distribution**: Visual representation of positive, neutral, and negative sentiment classifications
- **Performance Trends**: Time-series charts showing model performance over time
- **Model Comparison**: Side-by-side comparison of different models

### 📤 Data Upload Sections
The dashboard includes four dedicated upload sections for different stages of the data pipeline:

1. **Raw Data Upload**: Upload raw text data for initial processing
2. **Preprocessed Data Upload**: Upload cleaned and preprocessed data
3. **Model Results Upload**: Upload model prediction results
4. **Ground Truth Upload**: Upload labeled data for validation and comparison

### 📝 Activity Logging
- Real-time activity feed showing recent uploads and operations
- Timestamp tracking for all activities
- Success/error status indicators

### 📈 Visualizations
- Interactive line charts for performance trends
- Bar charts for model comparison
- Progress bars for sentiment distribution
- Responsive design for all screen sizes

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- No server or installation required - runs entirely in the browser

### Usage

1. **Open the Dashboard**
   ```bash
   # Simply open index.html in your web browser
   open index.html
   # Or for Linux
   xdg-open index.html
   # Or for Windows
   start index.html
   ```

2. **View Sample Metrics**
   - The dashboard loads with sample data by default
   - Explore the FinBERT and VADER+TextBlob metrics sections
   - View performance trends and sentiment distributions

3. **Upload Your Data**
   - Navigate to the Data Upload section
   - Select the appropriate upload card for your data type
   - Choose a file (supports .csv, .json, .txt formats)
   - Click the upload button
   - View updated metrics and activity logs

### Supported File Formats

#### CSV Format
```csv
model,sentiment,text,accuracy,precision,recall,f1
finbert,positive,"Great product!",89.2,88.5,87.3,87.9
finbert,negative,"Not satisfied",89.2,88.5,87.3,87.9
```

#### JSON Format
```json
[
  {
    "model": "finbert",
    "sentiment": "positive",
    "text": "Great product!",
    "accuracy": 89.2,
    "precision": 88.5,
    "recall": 87.3,
    "f1": 87.9
  }
]
```

## Dashboard Sections

### 1. Data Upload Section
Four dedicated upload areas for different data types:
- **Raw Data**: Initial text data before processing
- **Preprocessed**: Cleaned and formatted data
- **Model Results**: Prediction outputs from models
- **Ground Truth**: Labeled validation data

### 2. FinBERT Metrics
- Core performance metrics (Accuracy, Precision, Recall, F1)
- Performance trend chart
- Sentiment distribution breakdown

### 3. VADER + TextBlob Metrics
- Core performance metrics (Accuracy, Precision, Recall, F1)
- Performance trend chart
- Sentiment distribution breakdown

### 4. Model Comparison
- Side-by-side comparison chart
- Direct metric comparison across models

### 5. Recent Activity
- Upload history
- Processing status
- Timestamp tracking

## Technical Details

### Technologies Used
- **HTML5**: Structure and semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox, CSS-based visualizations
- **JavaScript (ES6+)**: Interactive functionality
- **No External Dependencies**: All visualizations built with pure CSS

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance
- Lightweight (< 50KB total)
- No external dependencies
- Fast load times
- Responsive on all devices

## Project Structure

```
kilwa-dashboard/
├── index.html      # Main HTML structure
├── styles.css      # CSS styling
├── script.js       # JavaScript functionality
└── README.md       # Documentation
```

## Customization

### Modifying Metrics
Edit `script.js` to adjust:
- Default metric values
- Chart configurations
- Color schemes
- Data processing logic

### Styling
Edit `styles.css` to customize:
- Color palette (CSS variables in `:root`)
- Layout and spacing
- Responsive breakpoints
- Animations

### Adding New Features
The modular code structure makes it easy to add:
- New model types
- Additional metrics
- Custom visualizations
- Export functionality

## Future Enhancements

Potential features for future development:
- [ ] Backend integration for data persistence
- [ ] Real-time data updates via WebSocket
- [ ] Advanced filtering and date range selection
- [ ] Export reports to PDF/Excel
- [ ] User authentication and multi-user support
- [ ] API integration for automated data ingestion
- [ ] Custom alert thresholds
- [ ] A/B testing comparison tools

## Contributing

To contribute to this project:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Kilwa data analysis pipeline.

## Support

For issues or questions:
- Open an issue in the repository
- Check the documentation
- Review the code comments

## Acknowledgments

- Pure CSS and JavaScript for lightweight implementation
- Modern web standards (ES6+, CSS Grid, Flexbox)
- The Kilwa team for requirements and feedback