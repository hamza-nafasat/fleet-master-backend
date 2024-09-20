import cron from "node-cron";

export function timeToCron(time: string) {
  const [hours, minutes] = time.split(":");
  return `${minutes} ${hours} * * *`;
}

export function scheduleCronJob(interval: string) {
  cron.schedule(interval, () => {
    console.log(`Running a task with interval ${interval}`);
    // Your logic to handle data
  });
}
