export class MatcherInfo {
  constructor(
    public readonly type: symbol,
    public readonly className: string,
    public readonly children: MatcherInfo[],
  ) {}
}
