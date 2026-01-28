# 🤖 ML Model Training

Train your own SwipeAuth behavioral biometrics model using your swipe data!

---

## 📋 Prerequisites

- Python 3.8+
- Swipe data exported from the SwipeAuth app (JSON file)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd ml-training
pip install -r requirements.txt
```

### 2. Export Your Swipe Data

1. Open the SwipeAuth app: https://swipeauthdemo.vercel.app
2. Swipe at least 30 times (more is better!)
3. Click "💾 Download Data for ML Training"
4. Move the downloaded JSON file to this `ml-training/` folder

### 3. Train Your Model

**Option A: Simple Adaptive Model** (Recommended for most users)

```bash
python train_simple_model.py
```

**Option B: One-Class SVM Model** (For consistent swipe patterns)

```bash
python train_model.py
```

---

## 🎯 Which Model Should You Use?

### Simple Adaptive Model (`train_simple_model.py`)
✅ **Best for: High-variance users** (swipe speed varies a lot)
- Uses statistical thresholds (mean ± 2 standard deviations)
- More forgiving, fewer false positives
- Adapts to YOUR specific variance
- Faster training

**When to use:**
- Your swipes vary between slow and fast
- You want a more lenient model
- First time training

### One-Class SVM (`train_model.py`)
✅ **Best for: Consistent swipers** (similar speed every time)
- Uses machine learning (RBF kernel)
- More sophisticated pattern recognition
- Better at detecting subtle differences
- Requires consistent training data

**When to use:**
- Your swipes are very consistent
- You want maximum security
- You have 50+ swipes of training data

---

## 📊 How It Works

### Simple Adaptive Model

1. Loads your swipe data from JSON
2. Calculates statistics:
   - Mean velocity
   - Standard deviation
   - Min/max acceptable ranges
3. Creates threshold model:
   - ALLOW: velocity within mean ± 2σ
   - BLOCK: velocity outside this range
4. Tests on sample scenarios
5. Saves model as `swipeauth_simple_model.pkl`

**Example output:**
```
📊 Your Swipe Statistics:
   Velocity: 537 ± 228 px/s
   Range: 81 - 993 px/s

✅ ALLOW: Your normal swipe (537 px/s)
🚨 BLOCK: Bot attack (2000 px/s)
```

### One-Class SVM Model

1. Loads swipe data
2. Extracts features: velocity, distance, duration
3. Normalizes features (StandardScaler)
4. Trains One-Class SVM with RBF kernel
5. Parameters: `nu=0.3, gamma='scale'`
6. Tests on multiple scenarios
7. Saves model, scaler, and profile as `swipeauth_model.pkl`

**Example output:**
```
🤖 Training One-Class SVM model...
✅ Model trained successfully!

📈 Model Performance:
   ✅ Normal: 28 swipes (90.3%)
   🚨 Anomalies: 3 swipes (9.7%)
```

---

## 🔍 Understanding Your Results

### Risk Score
- **0-30%**: Normal behavior, confident match
- **30-60%**: Slight deviation, still acceptable
- **60-100%**: High deviation, likely blocked

### Model Range
Your model learns an acceptable velocity range:
- **Example**: 81-1350 px/s means you typically swipe between these speeds
- Anything outside = potential attack/different user

---

## 📁 Output Files

After training, you'll get:

**Simple Model:**
- `swipeauth_simple_model.pkl` - Trained threshold model

**SVM Model:**
- `swipeauth_model.pkl` - Trained SVM + scaler + profile

---

## 🧪 Testing Your Model

Both scripts include automatic testing on these scenarios:

1. ✅ Your typical swipe
2. ✅ Slightly faster swipe
3. 🚨 Very fast swipe (bot/attacker)
4. 🚨 Very slow swipe (different user)
5. 🚨 Random user pattern

---

## 🔧 Advanced: Customizing Parameters

### Simple Model

Edit `train_simple_model.py`:
```python
# Change sensitivity (default: 2 standard deviations)
velocity_ok = (velocity_mean - 3*velocity_std) <= velocity <= (velocity_mean + 3*velocity_std)
```

### SVM Model

Edit `train_model.py`:
```python
# More strict (fewer outliers allowed)
model = OneClassSVM(kernel='rbf', nu=0.1, gamma='scale')

# More lenient (more outliers allowed)
model = OneClassSVM(kernel='rbf', nu=0.5, gamma='scale')
```

---

## 💡 Tips for Best Results

1. **Collect diverse data**: Swipe slow, medium, and fast during training
2. **Consistent environment**: Use same device/position when collecting data
3. **More is better**: 50+ swipes give more accurate models
4. **Regular retraining**: Retrain monthly as your behavior evolves
5. **Test thoroughly**: Use "Test Bot Attack" button in app to verify blocking works

---

## 🐛 Troubleshooting

### "No swipe data found!"
- Make sure JSON file is in the `ml-training/` folder
- File should start with `swipeauth_data_` and end with `.json`

### "Model blocks everything"
- You have high variance in your swipes
- Use the **Simple Adaptive Model** instead of SVM
- Collect more consistent training data

### "Model allows everything"
- Increase strictness (see Advanced section)
- Collect more training data
- Check if your swipes are too similar

---

## 📚 Learn More

- **Behavioral Biometrics**: https://en.wikipedia.org/wiki/Behavioural_biometrics
- **One-Class SVM**: https://scikit-learn.org/stable/modules/generated/sklearn.svm.OneClassSVM.html
- **Statistical Thresholds**: Understanding mean and standard deviation

---

## 🤝 Contributing

Found a better ML algorithm? Improved accuracy? Submit a PR!

Ideas for improvement:
- Add neural network option
- Multi-feature models (pressure, trajectory)
- Time-of-day adaptation
- Multi-user support

---

**Questions?** Open an issue on GitHub!

Built with 💚 by [JeniPreethi](https://github.com/JeniPreethi)
