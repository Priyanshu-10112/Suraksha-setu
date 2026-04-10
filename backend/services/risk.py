from config import RISK_BASE_MULTIPLIER, RISK_ZONE_BONUS

def get_risk_level(risk):
    """Get risk category"""
    if risk < 40:
        return "low"
    elif risk < 70:
        return "medium"
    else:
        return "high"
