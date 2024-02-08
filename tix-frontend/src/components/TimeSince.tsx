import { useEffect, useState } from "react";

export default function TimeSince(props: { timestamp: string }) {
  const timestamp = new Date(props.timestamp);
  const [now, setNow] = useState<Date | undefined>();

  useEffect(() => {
    setNow(new Date());

    const i = setInterval(() => setNow(new Date()), 1000);

    return () => clearInterval(i);
  }, []);

  if (!now) return null;

  const delta = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
  const second = (delta % 60).toString().padStart(2, "0");
  const minute = (Math.floor(delta / 60) % 60).toString().padStart(2, "0");
  const hours = Math.floor(delta / 3600);

  return (
    <>
      {hours}:{minute}:{second}
    </>
  );
}
