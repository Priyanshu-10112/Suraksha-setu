from config import RISK_BASE_MULTIPLIER, RISK_ZONE_BONUS

def calculate_risk(confidence, in_zone=False, low_light=False):
    """Calculate risk score"""
    risk = confidence * RISK_BASE_MULTIPLIER
    
    if in_zone:
        risk += RISK_ZONE_BONUS
    
    if low_light:
        risk += 10
    
    return int(risk)

def get_risk_level(risk):
    """Get risk category"""
    if risk < 40:
        return "low"
    elif risk < 70:
        return "medium"
    else:
        return "high"
