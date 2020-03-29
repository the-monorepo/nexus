export class MatcherInfo {
  constructor(
    public readonly type: Symbol,
    public readonly className: string,
    public readonly children: MatcherInfo[]  
  ) {}
}
