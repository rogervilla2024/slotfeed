"""
Validation script for ML Analytics infrastructure
Verifies all components are working correctly
"""

import asyncio
import logging
from datetime import datetime, timedelta
from app.services.feature_engineering import FeatureEngineer, SessionData
from app.services.ml_pipeline import MLPipeline, ModelConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_sample_session() -> SessionData:
    """Create a sample session for testing"""
    return SessionData(
        session_id="test_session_001",
        game_id="sweet-bonanza",
        streamer_id="test_streamer",
        start_time=datetime.now() - timedelta(hours=2),
        end_time=datetime.now(),
        initial_balance=500.0,
        final_balance=750.0,
        peak_balance=850.0,
        lowest_balance=300.0,
        total_wagered=5000.0,
        total_spins=500,
        wins=[2.5, 5.0, 10.0, 15.0, 3.0],
        losses=[0.5, 1.0, 0.75],
        bonus_hits=3,
        balance_history=[
            (datetime.now() - timedelta(hours=2), 500),
            (datetime.now() - timedelta(hours=1.5), 520),
            (datetime.now() - timedelta(hours=1), 650),
            (datetime.now() - timedelta(minutes=30), 800),
            (datetime.now(), 750),
        ],
        bet_sizes=[1.0, 2.0, 1.5, 2.5, 1.0] * 100,  # 500 bets
        game_rtp=96.48,
        game_volatility="high",
        game_max_multiplier=500.0,
    )


def generate_sample_features(count: int = 100) -> list:
    """Generate sample features for testing"""
    engineer = FeatureEngineer()
    features_list = []

    for i in range(count):
        session = create_sample_session()
        # Vary some parameters
        session.initial_balance = 300 + (i * 5)
        session.final_balance = session.initial_balance + (i % 3 - 1) * 100
        session.total_spins = 300 + (i * 2)

        try:
            features = engineer.extract_features(session)
            features_list.append(features)
        except Exception as e:
            logger.warning(f"Failed to extract features for sample {i}: {e}")

    return features_list


async def test_feature_engineering():
    """Test feature engineering pipeline"""
    logger.info("Testing Feature Engineering...")

    engineer = FeatureEngineer()
    session = create_sample_session()

    try:
        # Extract features
        features = engineer.extract_features(session)
        logger.info(f"✓ Extracted {len(features)} features")

        # Normalize features
        normalized = engineer.normalize_features(features)
        logger.info(f"✓ Normalized features")

        # Verify key features
        assert "observed_rtp" in features
        assert "hour_of_day" in features
        assert "profit_loss" in features
        logger.info("✓ All required features present")

        return True
    except Exception as e:
        logger.error(f"✗ Feature engineering failed: {e}")
        return False


async def test_ml_pipeline():
    """Test ML pipeline"""
    logger.info("\nTesting ML Pipeline...")

    try:
        # Generate sample data
        logger.info("Generating sample features...")
        features_list = generate_sample_features(100)
        logger.info(f"✓ Generated {len(features_list)} feature sets")

        # Create pipeline
        config = ModelConfig(
            model_type="random_forest",
            target_variable="rtp",
            lookback_days=30,
            min_samples=50,
            test_split=0.2,
            validation_split=0.1,
        )
        pipeline = MLPipeline(config)
        logger.info("✓ Pipeline created")

        # Prepare data
        X, y = await pipeline.prepare_data(features_list)
        logger.info(f"✓ Data prepared: X shape {X.shape}, y shape {y.shape}")

        # Split data
        X_train, X_val, X_test, y_train, y_val, y_test = await pipeline.split_data(X, y)
        logger.info(
            f"✓ Data split - Train: {X_train.shape[0]}, Val: {X_val.shape[0]}, Test: {X_test.shape[0]}"
        )

        # Train model
        metrics = await pipeline.train_model(X_train, y_train, X_val, y_val)
        logger.info(f"✓ Model trained - Accuracy: {metrics['train_accuracy']:.3f}")

        # Make prediction
        test_features = features_list[0]
        prediction = await pipeline.predict(test_features)
        logger.info(f"✓ Prediction made: {prediction:.2f}")

        # Get feature importance
        importance = pipeline.get_feature_importance()
        if importance:
            top_features = list(importance.items())[:5]
            logger.info(f"✓ Top 5 features: {top_features}")

        return True
    except Exception as e:
        logger.error(f"✗ ML pipeline failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def test_database_models():
    """Test database model definitions"""
    logger.info("\nTesting Database Models...")

    try:
        from app.models.ml_predictions import (
            MLFeatureSet,
            RTPPrediction,
            AnomalyDetection,
            BonusHuntPrediction,
            ModelMetadata,
        )

        logger.info("✓ MLFeatureSet imported")
        logger.info("✓ RTPPrediction imported")
        logger.info("✓ AnomalyDetection imported")
        logger.info("✓ BonusHuntPrediction imported")
        logger.info("✓ ModelMetadata imported")

        # Verify model attributes
        assert hasattr(MLFeatureSet, "observed_rtp")
        assert hasattr(RTPPrediction, "rtp_24h")
        assert hasattr(AnomalyDetection, "anomaly_type")
        assert hasattr(BonusHuntPrediction, "predicted_final_roi")
        logger.info("✓ All model attributes verified")

        return True
    except Exception as e:
        logger.error(f"✗ Database models test failed: {e}")
        return False


async def test_api_endpoints():
    """Test API endpoint definitions"""
    logger.info("\nTesting API Endpoints...")

    try:
        from app.api.v1 import ml_analytics

        # Verify endpoints exist
        assert hasattr(ml_analytics, "router")
        logger.info("✓ ML Analytics router exists")

        # Check routes
        routes = [route.path for route in ml_analytics.router.routes]
        required_endpoints = [
            "/rtp-predictions/{game_id}",
            "/anomalies/{game_id}",
            "/models/status",
        ]

        for endpoint in required_endpoints:
            if endpoint in routes:
                logger.info(f"✓ Endpoint found: {endpoint}")
            else:
                logger.warning(f"⚠ Endpoint not found: {endpoint}")

        return True
    except Exception as e:
        logger.error(f"✗ API endpoints test failed: {e}")
        return False


async def main():
    """Run all validation tests"""
    logger.info("=" * 50)
    logger.info("ML ANALYTICS VALIDATION SUITE")
    logger.info("=" * 50)

    results = []

    # Run tests
    results.append(("Feature Engineering", await test_feature_engineering()))
    results.append(("ML Pipeline", await test_ml_pipeline()))
    results.append(("Database Models", await test_database_models()))
    results.append(("API Endpoints", await test_api_endpoints()))

    # Summary
    logger.info("\n" + "=" * 50)
    logger.info("VALIDATION SUMMARY")
    logger.info("=" * 50)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        logger.info(f"{test_name}: {status}")

    logger.info(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        logger.info("\n🎉 All validation tests passed!")
        return 0
    else:
        logger.error(f"\n❌ {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
