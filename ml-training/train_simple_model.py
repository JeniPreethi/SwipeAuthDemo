import json
import numpy as np
import pickle

print("🚀 SwipeAuth SIMPLE Model Training")
print("=" * 50)
print("(Better for high-variance users!)")
print()

# Load data
json_files = [f for f in __import__('os').listdir('.') if f.startswith('swipeauth_data_') and f.endswith('.json')]
latest_file = sorted(json_files)[-1]

with open(latest_file, 'r') as f:
    data = json.load(f)

print(f"📂 Loaded: {latest_file}")
print(f"✅ {len(data['swipeHistory'])} swipes")
print()

# Extract velocities
velocities = [s['velocity'] for s in data['swipeHistory']]
distances = [s['distance'] for s in data['swipeHistory']]

# Calculate statistics
velocity_mean = np.mean(velocities)
velocity_std = np.std(velocities)
velocity_min = np.min(velocities)
velocity_max = np.max(velocities)

distance_mean = np.mean(distances)
distance_std = np.std(distances)

print("📊 Your Swipe Statistics:")
print(f"   Velocity: {velocity_mean:.0f} ± {velocity_std:.0f} px/s")
print(f"   Range: {velocity_min:.0f} - {velocity_max:.0f} px/s")
print(f"   Distance: {distance_mean:.0f} ± {distance_std:.0f} px")
print()

# Simple model: Accept anything within 2 standard deviations
# This is more forgiving for high-variance users!
model = {
    'type': 'simple_threshold',
    'velocity_mean': velocity_mean,
    'velocity_std': velocity_std,
    'velocity_min': velocity_min - velocity_std,  # Allow some below
    'velocity_max': velocity_max + velocity_std,  # Allow some above
    'distance_mean': distance_mean,
    'distance_std': distance_std,
}

# Save the model
with open('swipeauth_simple_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("💾 Simple model saved!")
print()

# Test the model
def predict(velocity, distance):
    """
    Returns True if swipe looks normal, False if suspicious
    """
    # Check if within reasonable range (mean ± 2 std devs)
    velocity_ok = (velocity_mean - 2*velocity_std) <= velocity <= (velocity_mean + 2*velocity_std)
    distance_ok = (distance_mean - 2*distance_std) <= distance <= (distance_mean + 2*distance_std)

    return velocity_ok and distance_ok

print("🧪 Testing Simple Model:")
print("=" * 50)

test_scenarios = [
    {'name': 'Your slow swipe', 'velocity': 225, 'distance': 50},
    {'name': 'Your medium swipe', 'velocity': 537, 'distance': 161},
    {'name': 'Your fast swipe', 'velocity': 803, 'distance': 224},
    {'name': 'Slightly outside range', 'velocity': 900, 'distance': 250},
    {'name': 'VERY FAST (bot)', 'velocity': 2000, 'distance': 400},
    {'name': 'VERY SLOW (elderly)', 'velocity': 50, 'distance': 20},
]

for scenario in test_scenarios:
    result = predict(scenario['velocity'], scenario['distance'])

    if result:
        print(f"✅ {scenario['name']}: ALLOW")
    else:
        print(f"🚨 {scenario['name']}: BLOCK")

print()
print("=" * 50)
print("📊 Model Summary:")
print("=" * 50)
print(f"✅ ALLOW: {velocity_mean - 2*velocity_std:.0f} - {velocity_mean + 2*velocity_std:.0f} px/s")
print(f"🚨 BLOCK: Anything outside this range")
print()
print("💡 This model is MORE FORGIVING for users with variable behavior!")
print("   It adapts to YOUR variance, not some 'average' user.")
print()
print("🎉 Perfect for high-variance users like you!")
