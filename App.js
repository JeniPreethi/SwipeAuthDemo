import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
  import { useState, useRef } from 'react';

  // 🤖 ML MODEL THRESHOLDS (from your trained simple model!)
  const MODEL_MIN_VELOCITY = 0;  // Practical minimum
  const MODEL_MAX_VELOCITY = 1350;  // Your trained max threshold
  const MODEL_MEAN_VELOCITY = 537;  // Your typical swipe speed

  export default function App() {
    const [currentSwipe, setCurrentSwipe] = useState({
      x: 0, y: 0, distance: 0, velocity: 0, duration: 0,
    });
    const [swipeHistory, setSwipeHistory] = useState([]);
    const [userProfile, setUserProfile] = useState({
      avgVelocity: 0,
      avgDistance: 0,
      totalSwipes: 0,
    });
    const [authResult, setAuthResult] = useState(null);

    const startPos = useRef({ x: 0, y: 0 });
    const startTime = useRef(0);

    const calculateRiskScore = (velocity, distance) => {
      if (swipeHistory.length < 3) return 0;
      const avgVel = userProfile.avgVelocity;
      const velocityDiff = Math.abs(velocity - avgVel);
      const velocityDeviation = avgVel > 0 ? (velocityDiff / avgVel) : 0;
      const risk = Math.min(velocityDeviation, 1);
      return risk;
    };

    // 🤖 ML MODEL PREDICTION (using your trained model!)
    const predictWithModel = (velocity) => {
      if (velocity < MODEL_MIN_VELOCITY || velocity > MODEL_MAX_VELOCITY) {
        // Outside your learned range = BLOCK
        const deviation = Math.abs(velocity - MODEL_MEAN_VELOCITY) / MODEL_MEAN_VELOCITY;
        return {
          authenticated: false,
          riskScore: Math.min(deviation, 1),
          message: '🚨 ACCESS DENIED',
          reason: 'Swipe pattern does not match trained model'
        };
      }

      // Within your learned range = ALLOW
      const deviation = Math.abs(velocity - MODEL_MEAN_VELOCITY) / MODEL_MEAN_VELOCITY;
      return {
        authenticated: true,
        riskScore: deviation,
        message: '✅ AUTHENTICATED',
        reason: 'Swipe pattern matches your profile'
      };
    };

    const handleMouseDown = (event) => {
      startPos.current = { x: event.clientX, y: event.clientY };
      startTime.current = Date.now();
    };

    const handleMouseMove = (event) => {
      if (event.buttons === 1) {
        const x = event.clientX;
        const y = event.clientY;

        const dist = Math.sqrt(
          Math.pow(x - startPos.current.x, 2) +
          Math.pow(y - startPos.current.y, 2)
        );

        const duration = Date.now() - startTime.current;
        const velocity = duration > 0 ? (dist / duration) * 1000 : 0;

        setCurrentSwipe({
          x, y,
          distance: Math.round(dist),
          velocity: Math.round(velocity),
          duration,
        });
      }
    };

    const handleMouseUp = () => {
    if (currentSwipe.distance > 20) {
      // 🤖 RUN ML PREDICTION!
      const prediction = predictWithModel(currentSwipe.velocity);
      setAuthResult(prediction);

      const newSwipe = {
        ...currentSwipe,
        timestamp: new Date().toLocaleTimeString(),
        risk: calculateRiskScore(currentSwipe.velocity, currentSwipe.distance),
        mlPrediction: prediction.authenticated ? 'ALLOW' : 'BLOCK',
        mlRiskScore: prediction.riskScore,
      };

      // Store ALL swipes (no limit!)
      const newHistory = [newSwipe, ...swipeHistory];
      setSwipeHistory(newHistory);

      // Calculate profile from ALL swipes
      const totalSwipes = newHistory.length;
      const sumVelocity = newHistory.reduce((sum, s) => sum + s.velocity, 0);
      const sumDistance = newHistory.reduce((sum, s) => sum + s.distance, 0);

      setUserProfile({
        avgVelocity: Math.round(sumVelocity / newHistory.length),
        avgDistance: Math.round(sumDistance / newHistory.length),
        totalSwipes,
      });

      console.log('Swipe recorded:', newSwipe);
      console.log('🤖 ML Prediction:', prediction.message);
      console.log('Total swipes stored:', totalSwipes);

      // Auto-clear authentication result after 3 seconds
      setTimeout(() => setAuthResult(null), 3000);
    }
  };

    // 🤖 Simulate Bot Attack (for demo purposes)
    const simulateBotAttack = () => {
      const botSwipe = {
        x: 300,
        y: 200,
        distance: 500,
        velocity: 2000,  // WAY too fast!
        duration: 250,
        timestamp: new Date().toLocaleTimeString(),
        risk: 1.0,
        mlPrediction: 'BLOCK',
        mlRiskScore: 1.0,
      };

      // Run ML prediction
      const prediction = predictWithModel(botSwipe.velocity);
      setAuthResult(prediction);

      // Add to history
      const newHistory = [botSwipe, ...swipeHistory];
      setSwipeHistory(newHistory);

      console.log('🤖 Bot attack simulated!', botSwipe);
      console.log('🚨 ML Prediction:', prediction.message);

      // Auto-clear after 3 seconds
      setTimeout(() => setAuthResult(null), 3000);
    };

    const exportData = () => {
      if (swipeHistory.length === 0) {
        alert('Please swipe at least once before downloading data!');
        return;
      }

      const data = {
        userProfile: userProfile,
        swipeHistory: swipeHistory,
        exportDate: new Date().toISOString(),
        totalSwipes: swipeHistory.length,
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `swipeauth_data_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      alert(`Downloaded ${swipeHistory.length} swipes!`);
      console.log('Data exported!', data);
    };

    const getRiskColor = (risk) => {
      if (risk < 0.3) return '#4CAF50';
      if (risk < 0.6) return '#FF9800';
      return '#F44336';
    };

    const getRiskLabel = (risk) => {
      if (risk < 0.3) return '✅ Normal';
      if (risk < 0.6) return '⚠️ Suspicious';
      return '🚨 High Risk';
    };

    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>🔐 SwipeAuth Pro</Text>
          <Text style={styles.subtitle}>ML-Powered Behavioral Biometrics</Text>

          {/* ML MODEL INFO BOX */}
          <View style={styles.modelInfoBox}>
            <Text style={styles.modelInfoTitle}>🤖 Your Trained ML Model</Text>
            <Text style={styles.modelInfoText}>
              Learned Range: {MODEL_MIN_VELOCITY}-{MODEL_MAX_VELOCITY} px/s
            </Text>
            <Text style={styles.modelInfoText}>
              Your Typical Speed: {MODEL_MEAN_VELOCITY} px/s
            </Text>
            <Text style={styles.modelInfoSubtext}>
              Model blocks swipes outside your learned pattern
            </Text>
          </View>

          {/* DOWNLOAD BUTTON - Always visible */}
          <TouchableOpacity style={styles.downloadButton} onPress={exportData}>
            <Text style={styles.downloadButtonText}>
              💾 Download Data for ML Training
            </Text>
            <Text style={styles.downloadButtonSubtext}>
              {swipeHistory.length > 0 ? `(${swipeHistory.length} total swipes ready!)` : '(Swipe first, then download)'}
            </Text>
          </TouchableOpacity>

          {/* 🤖 TEST BOT ATTACK BUTTON */}
          <TouchableOpacity style={styles.botButton} onPress={simulateBotAttack}>
            <Text style={styles.botButtonText}>
              🤖 Test Bot Attack
            </Text>
            <Text style={styles.botButtonSubtext}>
              (Simulate malicious 2000 px/s swipe)
            </Text>
          </TouchableOpacity>

          {/* 🤖 REAL-TIME ML AUTHENTICATION RESULT */}
          {authResult && (
            <View style={[
              styles.authResultBox,
              { backgroundColor: authResult.authenticated ? '#4CAF50' : '#F44336' }
            ]}>
              <Text style={styles.authResultTitle}>🤖 ML Model Decision</Text>
              <Text style={styles.authResultMessage}>{authResult.message}</Text>
              <Text style={styles.authResultReason}>{authResult.reason}</Text>
              <View style={styles.authResultStats}>
                <Text style={styles.authResultStat}>
                  Risk Score: {Math.round(authResult.riskScore * 100)}%
                </Text>
                <Text style={styles.authResultStat}>
                  Model Range: {MODEL_MIN_VELOCITY}-{MODEL_MAX_VELOCITY} px/s
                </Text>
              </View>
            </View>
          )}

          {/* User Profile */}
          <View style={styles.profileBox}>
            <Text style={styles.sectionTitle}>👤 Your Swipe Profile</Text>
            <View style={styles.profileGrid}>
              <View style={styles.profileStat}>
                <Text style={styles.profileLabel}>Avg Velocity</Text>
                <Text style={styles.profileValue}>{userProfile.avgVelocity} px/s</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileLabel}>Avg Distance</Text>
                <Text style={styles.profileValue}>{userProfile.avgDistance} px</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileLabel}>Total Swipes</Text>
                <Text style={styles.profileValue}>{userProfile.totalSwipes}</Text>
              </View>
            </View>
          </View>

          {/* Current Swipe Stats */}
          <View style={styles.statsBox}>
            <Text style={styles.sectionTitle}>📊 Current Swipe</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Velocity:</Text>
              <Text style={styles.statValue}>{currentSwipe.velocity} px/s</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Distance:</Text>
              <Text style={styles.statValue}>{currentSwipe.distance} px</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Duration:</Text>
              <Text style={styles.statValue}>{currentSwipe.duration} ms</Text>
            </View>
          </View>

          {/* Swipe Area */}
          <div
            style={{
              width: '100%',
              maxWidth: 600,
              height: 250,
              backgroundColor: currentSwipe.velocity > 800 ? '#FF5722' : '#4CAF50',
              borderRadius: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background-color 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <Text style={styles.touchAreaText}>
              {currentSwipe.velocity === 0 && '👆 Swipe to collect training data!'}
              {currentSwipe.velocity > 0 && currentSwipe.velocity < 500 && '🐢 Slow'}
              {currentSwipe.velocity >= 500 && currentSwipe.velocity < 1000 && '🏃 Medium'}
              {currentSwipe.velocity >= 1000 && '⚡ FAST!'}
            </Text>
            {swipeHistory.length > 0 && (
              <Text style={{...styles.touchAreaText, fontSize: 16, marginTop: 10}}>
                {swipeHistory.length} swipes collected
              </Text>
            )}
          </div>

          {/* Swipe History - Only show last 10 */}
          <View style={styles.historyBox}>
            <Text style={styles.sectionTitle}>
              📜 Recent Swipes (Last 10 of {swipeHistory.length})
            </Text>
            {swipeHistory.length === 0 && (
              <Text style={styles.emptyText}>No swipes yet. Start swiping to build your profile!</Text>
            )}
            {swipeHistory.slice(0, 10).map((swipe, index) => (
              <View 
                key={index} 
                style={[
                  styles.historyItem,
                  { borderLeftColor: getRiskColor(swipe.risk), borderLeftWidth: 4 }
                ]}
              >
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTime}>{swipe.timestamp}</Text>
                  <Text style={[styles.riskBadge, { backgroundColor: getRiskColor(swipe.risk) }]}>
                    {getRiskLabel(swipe.risk)}
                  </Text>
                </View>
                {swipe.mlPrediction && (
                  <View style={[styles.mlBadge, {
                    backgroundColor: swipe.mlPrediction === 'ALLOW' ? '#4CAF50' : '#F44336'
                  }]}>
                    <Text style={styles.mlBadgeText}>
                      🤖 ML: {swipe.mlPrediction} (Risk: {Math.round(swipe.mlRiskScore * 100)}%)
                    </Text>
                  </View>
                )}
                <View style={styles.historyStats}>
                  <Text style={styles.historyStatText}>
                    {swipe.velocity} px/s • {swipe.distance} px • {swipe.duration} ms
                  </Text>
                </View>
                {swipe.risk > 0.6 && (
                  <Text style={styles.warningText}>
                    ⚠️ This swipe is {Math.round(swipe.risk * 100)}% different from your profile!
                  </Text>
                )}
              </View>
            ))}
          </View>

          {swipeHistory.length >= 3 && (
            <View style={styles.insightBox}>
              <Text style={styles.insightTitle}>💡 AI Insight</Text>
              <Text style={styles.insightText}>
                After {swipeHistory.length} swipes, your typical velocity is {userProfile.avgVelocity} px/s.
                SwipeAuth will flag any swipe that's more than 30% different as suspicious!
              </Text>
              {swipeHistory.length < 30 && (
                <Text style={{...styles.insightText, marginTop: 10, fontStyle: 'italic', color: '#FF9800'}}>
                  💪 Collect {30 - swipeHistory.length} more swipes for a more accurate ML model!
                </Text>
              )}
              {swipeHistory.length >= 30 && (
                <Text style={{...styles.insightText, marginTop: 10, fontWeight: 'bold', color: '#4CAF50'}}>
                  ✅ Great! You have {swipeHistory.length} swipes - perfect for training!
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      backgroundColor: '#f5f5f5',
    },
    container: {
      flex: 1,
      alignItems: 'center',
      padding: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 36,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 5,
      color: '#333',
    },
    subtitle: {
      fontSize: 16,
      color: '#666',
      marginBottom: 20,
    },
    modelInfoBox: {
      backgroundColor: '#E8F5E9',
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
      width: '100%',
      maxWidth: 600,
      borderLeftWidth: 4,
      borderLeftColor: '#4CAF50',
    },
    modelInfoTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#2E7D32',
      marginBottom: 8,
    },
    modelInfoText: {
      fontSize: 13,
      color: '#1B5E20',
      marginBottom: 3,
      fontFamily: 'monospace',
    },
    modelInfoSubtext: {
      fontSize: 12,
      color: '#558B2F',
      marginTop: 5,
      fontStyle: 'italic',
    },
    downloadButton: {
      backgroundColor: '#2196F3',
      padding: 18,
      borderRadius: 12,
      marginBottom: 25,
      width: '100%',
      maxWidth: 600,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      cursor: 'pointer',
    },
    downloadButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    downloadButtonSubtext: {
      color: '#fff',
      fontSize: 12,
      marginTop: 5,
      opacity: 0.9,
    },
    botButton: {
      backgroundColor: '#FF5722',
      padding: 18,
      borderRadius: 12,
      marginBottom: 25,
      width: '100%',
      maxWidth: 600,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      cursor: 'pointer',
      borderWidth: 2,
      borderColor: '#F44336',
    },
    botButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    botButtonSubtext: {
      color: '#fff',
      fontSize: 12,
      marginTop: 5,
      opacity: 0.9,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      color: '#333',
    },
    profileBox: {
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 10,
      marginBottom: 20,
      width: '100%',
      maxWidth: 600,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    profileGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    profileStat: {
      alignItems: 'center',
    },
    profileLabel: {
      fontSize: 12,
      color: '#666',
      marginBottom: 5,
    },
    profileValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#4CAF50',
      fontFamily: 'monospace',
    },
    statsBox: {
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 10,
      marginBottom: 20,
      width: '100%',
      maxWidth: 600,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    statLabel: {
      fontSize: 16,
      color: '#666',
    },
    statValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      fontFamily: 'monospace',
    },
    touchAreaText: {
      fontSize: 22,
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center',
      padding: 20,
    },
    historyBox: {
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 10,
      marginTop: 20,
      marginBottom: 20,
      width: '100%',
      maxWidth: 600,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    emptyText: {
      textAlign: 'center',
      color: '#999',
      fontStyle: 'italic',
      padding: 20,
    },
    historyItem: {
      backgroundColor: '#f9f9f9',
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    historyTime: {
      fontSize: 12,
      color: '#666',
      fontFamily: 'monospace',
    },
    riskBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      fontSize: 12,
      color: '#fff',
      fontWeight: 'bold',
    },
    historyStats: {
      marginTop: 5,
    },
    historyStatText: {
      fontSize: 14,
      color: '#666',
      fontFamily: 'monospace',
    },
    warningText: {
      marginTop: 8,
      fontSize: 12,
      color: '#F44336',
      fontStyle: 'italic',
    },
    insightBox: {
      backgroundColor: '#E3F2FD',
      padding: 20,
      borderRadius: 10,
      marginBottom: 20,
      width: '100%',
      maxWidth: 600,
      borderLeftWidth: 4,
      borderLeftColor: '#2196F3',
    },
    insightTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#1976D2',
    },
    insightText: {
      fontSize: 14,
      color: '#555',
      lineHeight: 20,
    },
    authResultBox: {
      padding: 25,
      borderRadius: 15,
      marginBottom: 25,
      width: '100%',
      maxWidth: 600,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      borderWidth: 3,
      borderColor: '#fff',
    },
    authResultTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 10,
      opacity: 0.9,
    },
    authResultMessage: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 8,
      textAlign: 'center',
    },
    authResultReason: {
      fontSize: 14,
      color: '#fff',
      marginBottom: 15,
      textAlign: 'center',
      opacity: 0.95,
    },
    authResultStats: {
      width: '100%',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.3)',
      paddingTop: 15,
      alignItems: 'center',
    },
    authResultStat: {
      fontSize: 13,
      color: '#fff',
      marginBottom: 5,
      fontFamily: 'monospace',
      opacity: 0.9,
    },
    mlBadge: {
      padding: 8,
      borderRadius: 6,
      marginTop: 8,
      marginBottom: 8,
    },
    mlBadgeText: {
      fontSize: 12,
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

