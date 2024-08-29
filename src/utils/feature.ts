import { clientNotificationsSelection } from "../constants/socketState.js";
import { Alert } from "../models/alertModel/alert.model.js";

const getNewAlertsForUserAndSaveInState = async (userId: any) => {
  const alerts = await Alert.find({ ownerId: String(userId), status: "enable" });
  const modifiedAlerts = alerts.map((alert) => {
    return {
      type: alert.type,
      status: alert.status,
      platform: alert.platform,
      severity: alert.severity,
    };
  });
  clientNotificationsSelection.set(String(userId), modifiedAlerts);
};

export { getNewAlertsForUserAndSaveInState };
