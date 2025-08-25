export class Duration {
  public static second(second: number) {
    return second;
  }

  public static minute(minute: number) {
    return minute * 60;
  }

  public static hour(hour: number) {
    return hour * 3600;
  }
}
