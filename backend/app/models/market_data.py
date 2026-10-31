from pydantic import BaseModel, Field
from datetime import datetime

class MarketDataModel(BaseModel):
    id: str = Field(alias="_id")
    ipo_id: str
    observed_at: datetime = Field(default_factory=datetime.utcnow)
    gmp_rs: float = 85.0
    gmp_pct: float = 17.89 # GMP percentage against upper price band
    subscription_qib_x: float = 12.4
    subscription_nii_x: float = 8.1
    subscription_retail_x: float = 4.2
    subscription_total_x: float = 8.6
    sentiment_label: str = "Bullish" # Bullish | Neutral | Cautious | Bearish
    source: str = "NSE/BSE Exchange Disclosures"

    class Config:
        populate_by_name = True
