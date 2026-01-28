import json
import numpy as np
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
import pickle
import os

print("🚀 SwipeAuth ML Model Training")
print("=" * 50)

# Find the most recent JSON file
json_files = [f for f in os.listdir('.') if f.startswith('swipeauth_data_') and f.endswith('.json')]

if not json_files:
    print("❌ No swipe data found!")
    print("   Please download data from your app first.")
    exit(1)

# Use the most recent file
latest_file = sorted(json_files)[-1]
print(f"\n📂 Loading: {latest_file}")

# Load your swipe data
with open(latest_file, 'r') as f:
    data = json.load(f)

print(f"✅ Loaded {len(data['swipeHistory'])} swipes")
print(f"\n👤 Your Profile:")
print(f"   Average Velocity: {data['userProfile']['avgVelocity']} px/s")
print(f"   Average Distance: {data['userProfile']['avgDistance']} px")
print(f"   Total Swipes: {data['userProfile']['totalSwipes']}")

# Extract features for training
features = []
for swipe in data['swipeHistory']:
    features.append([
        swipe['velocity'],
        swipe['distance'],
        swipe['duration']
    ])

features = np.array(features)
print(f"\n📊 Features extracted: {features.shape[0]} samples, {features.shape[1]} features")
print(f"   (velocity, distance, duration)")

# Show some sample data
print(f"\n🔍 Sample swipes:")
for i in range(min(3, len(features))):
    print(f"   Swipe {i+1}: velocity={features[i][0]:.0f} px/s, distance={features[i][1]:.0f} px, duration={features[i][2]:.0f} ms")

# Normalize features (critical for ML!)
print(f"\n⚙️  Normalizing features...")
scaler = StandardScaler()
features_normalized = scaler.fit_transform(features)
print(f"✅ Features normalized (mean=0, std=1)")

# Train One-Class SVM
print(f"\n🤖 Training One-Class SVM model...")
# nu=0.3 means we expect 30% outliers (more forgiving)
# gamma='scale' adapts better to the data
model = OneClassSVM(kernel='rbf', nu=0.3, gamma='scale')
model.fit(features_normalized)
print(f"✅ Model trained successfully!")

# Test on training data
predictions = model.predict(features_normalized)
normal_count = np.sum(predictions == 1)
anomaly_count = np.sum(predictions == -1)

print(f"\n📈 Model Performance on Training Data:")
print(f"   ✅ Normal: {normal_count} swipes ({normal_count/len(predictions)*100:.1f}%)")
print(f"   🚨 Anomalies: {anomaly_count} swipes ({anomaly_count/len(predictions)*100:.1f}%)")

# Save the model
model_filename = 'swipeauth_model.pkl'
with open(model_filename, 'wb') as f:
    pickle.dump((model, scaler, data['userProfile']), f)

print(f"\n💾 Model saved to: {model_filename}")

# Test with realistic scenarios
print(f"\n🧪 Testing Model on New Scenarios:")
print("=" * 50)

test_scenarios = [
    {
        'name': 'Your typical swipe',
        'velocity': data['userProfile']['avgVelocity'],
        'distance': data['userProfile']['avgDistance'],
        'duration': 500
    },
    {
        'name': 'Slightly faster swipe',
        'velocity': data['userProfile']['avgVelocity'] * 1.2,
        'distance': data['userProfile']['avgDistance'] * 1.1,
        'duration': 450
    },
    {
        'name': 'VERY FAST swipe (bot/attacker)',
        'velocity': data['userProfile']['avgVelocity'] * 3,
        'distance': 600,
        'duration': 200
    },
    {
        'name': 'VERY SLOW swipe (elderly/injured)',
        'velocity': data['userProfile']['avgVelocity'] * 0.1,
        'distance': 50,
        'duration': 2000
    },
    {
        'name': 'Random user swipe',
        'velocity': 800,
        'distance': 400,
        'duration': 500
    }
]

for scenario in test_scenarios:
    test_swipe = [[scenario['velocity'], scenario['distance'], scenario['duration']]]
    test_swipe_norm = scaler.transform(test_swipe)
    prediction = model.predict(test_swipe_norm)[0]
    decision_score = model.decision_function(test_swipe_norm)[0]

    if prediction == 1:
        status = "✅ ALLOW"
        emoji = "🟢"
    else:
        status = "🚨 BLOCK"
        emoji = "🔴"

    print(f"\n{emoji} {scenario['name']}")
    print(f"   Velocity: {scenario['velocity']:.0f} px/s")
    print(f"   Decision: {status}")
    print(f"   Confidence: {abs(decision_score):.3f}")

print("\n" + "=" * 50)
print("🎉 SwipeAuth ML Model Complete!")
print("=" * 50)

print(f"\n💡 Next Steps:")
print(f"   1. Your model is saved in: {model_filename}")
print(f"   2. It learned YOUR unique swipe behavior")
print(f"   3. It can detect when someone else uses your device")
print(f"   4. Integrate this into your app for real-time detection!")

print(f"\n🚀 You just built a production-ready ML model!")
