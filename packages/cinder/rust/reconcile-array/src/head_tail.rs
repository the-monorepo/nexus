use crate::*;
use immutable_operators::*;
use reconcilable_trait::Reconcilable;

/**
 * Lowest level layer of reconciling an array. Pretty much all the work done in reconciling an array only requires referring to the
 * head and the tail so we've made traits to communicate that in a generic way.
 */
#[derive(Debug, PartialEq)]
pub struct HeadTail<HeadGeneric, TailGeneric> {
    pub head: HeadGeneric,
    pub tail: TailGeneric,
}

#[derive(Debug, PartialEq)]
pub struct Nothing;

impl<HeadGeneric, TailGeneric> HeadTail<HeadGeneric, TailGeneric> {
    pub fn new(head: HeadGeneric, tail: TailGeneric) -> Self {
        HeadTail { head, tail }
    }
}

impl HeadTail<Nothing, Nothing> {
    pub fn nothing() -> HeadTail<Nothing, Nothing> {
        return HeadTail::new(Nothing, Nothing);
    }
}

pub trait Wrapper {
    type Wrapped<T>;
    fn wrap<T>(value: T) -> Self::Wrapped<T>;
}

pub trait Unwrapper {
    type Unwrapped;
    fn unwrap(self) -> Self::Unwrapped;
}

impl<CurrentValue, NewValue> Reconcilable<NewValue> for Head<CurrentValue>
where
    CurrentValue: Reconcilable<NewValue>,
{
    type Reconciled = Head<CurrentValue::Reconciled>;
    type Unreconciled = Head<CurrentValue::Unreconciled>;

    fn reconcile(self, new_value: NewValue) -> Result<Self::Reconciled, Self::Unreconciled> {
        self.unwrap()
            .reconcile(new_value)
            .map(Self::wrap)
            .map_err(Self::wrap)
    }
}

impl<CurrentValue, NewValue> Reconcilable<NewValue> for Tail<CurrentValue>
where
    CurrentValue: Reconcilable<NewValue>,
{
    type Reconciled = Tail<CurrentValue::Reconciled>;
    type Unreconciled = Tail<CurrentValue::Unreconciled>;

    fn reconcile(self, new_value: NewValue) -> Result<Self::Reconciled, Self::Unreconciled> {
        self.unwrap()
            .reconcile(new_value)
            .map(Self::wrap)
            .map_err(Self::wrap)
    }
}

impl<V> Wrapper for Head<V> {
    type Wrapped<T> = Head<T>;

    fn wrap<T>(value: T) -> Self::Wrapped<T> {
        Head(value)
    }
}

impl<V> Wrapper for Tail<V> {
    type Wrapped<T> = Tail<T>;

    fn wrap<T>(value: T) -> Self::Wrapped<T> {
        Tail(value)
    }
}

impl<T> Unwrapper for Head<T> {
    type Unwrapped = T;
    fn unwrap(self) -> T {
        self.0
    }
}

impl<T> Unwrapper for Tail<T> {
    type Unwrapped = T;
    fn unwrap(self) -> T {
        self.0
    }
}

/**
 * Used to identify whether to operate on the head for head tail traits
 */
#[derive(PartialEq, Debug)]
pub struct Head<H = ()>(pub H);

/*impl<T, NewValue> Reconcilable<NewValue> for T
where
    T: Wrapper,
    T: Unwrapper,
    T::Unwrapped: Reconcilable<NewValue>,
{
    type Reconciled = T::Wrapped<<T::Unwrapped as Reconcilable<NewValue>>::Reconciled>;
    type Unreconciled = T::Wrapped<<T::Unwrapped as Reconcilable<NewValue>>::Unreconciled>;

    fn reconcile(self, new_value: NewValue) -> Result<Self::Reconciled, Self::Unreconciled> {
        self.unwrap()
            .reconcile(new_value)
            .map_or_else(T::wrap, T::wrap)
    }
}*/

pub const HEAD: Head<()> = Head(());

/**
 * Used to identify whether to operate on the tail for head-tail traits
 */
#[derive(PartialEq, Debug)]
pub struct Tail<T = ()>(pub T);
pub const TAIL: Tail<()> = Tail(());

impl<H, T> HeadTail<H, T> {
    fn merge_head<V>(self, head: V) -> HeadTail<V, T> {
        HeadTail {
            head,
            tail: self.tail,
        }
    }

    fn merge_tail<V>(self, tail: V) -> HeadTail<H, V> {
        HeadTail {
            head: self.head,
            tail,
        }
    }
}

impl<CurrentHead, HeadGeneric, TailGeneric> MergeTrait<Head<HeadGeneric>>
    for HeadTail<CurrentHead, TailGeneric>
{
    type MergedObject = HeadTail<HeadGeneric, TailGeneric>;
    fn merge(self, head: Head<HeadGeneric>) -> HeadTail<HeadGeneric, TailGeneric> {
        self.merge_head(head.unwrap())
    }
}

impl<CurrentTail, HeadGeneric, TailGeneric> MergeTrait<Tail<TailGeneric>>
    for HeadTail<HeadGeneric, CurrentTail>
{
    type MergedObject = HeadTail<HeadGeneric, TailGeneric>;
    fn merge(self, tail: Tail<TailGeneric>) -> HeadTail<HeadGeneric, TailGeneric> {
        self.merge_tail(tail.unwrap())
    }
}

impl<HeadGeneric, NewValue, CurrentValue> Reconcilable<Tail<NewValue>>
    for HeadTail<HeadGeneric, CurrentValue>
where
    CurrentValue: Reconcilable<NewValue>,
{
    type Reconciled = HeadTail<HeadGeneric, CurrentValue::Reconciled>;
    type Unreconciled = HeadTail<HeadGeneric, CurrentValue::Unreconciled>;

    fn reconcile(self, new_value: Tail<NewValue>) -> Result<Self::Reconciled, Self::Unreconciled> {
        let (other, tail): (_, Tail<_>) = self.split();

        return match tail.reconcile(new_value.unwrap()) {
            Ok(reconciled) => Ok(other.merge(reconciled)),
            Err(unreconciled) => Err(other.merge(unreconciled)),
        };
    }
}

impl<TailGeneric, NewValue, CurrentValue> Reconcilable<Head<NewValue>>
    for HeadTail<CurrentValue, TailGeneric>
where
    CurrentValue: Reconcilable<NewValue>,
{
    type Reconciled = HeadTail<CurrentValue::Reconciled, TailGeneric>;
    type Unreconciled = HeadTail<CurrentValue::Unreconciled, TailGeneric>;

    fn reconcile(self, new_value: Head<NewValue>) -> Result<Self::Reconciled, Self::Unreconciled> {
        let (other, head): (_, Head<_>) = self.split();

        return match head.reconcile(new_value.unwrap()) {
            Ok(reconciled) => Ok(other.merge(reconciled)),
            Err(unreconciled) => Err(other.merge(unreconciled)),
        };
    }
}

impl<HeadGeneric> HeadTail<HeadGeneric, Nothing> {
    pub fn head(head: HeadGeneric) -> Self {
        HeadTail {
            head,
            tail: Nothing,
        }
    }
}

impl<TailGeneric> HeadTail<Nothing, TailGeneric> {
    pub fn tail(tail: TailGeneric) -> Self {
        HeadTail {
            head: Nothing,
            tail,
        }
    }
}

impl<HeadGeneric, Value> SplitTrait<Tail<Value>> for HeadTail<HeadGeneric, Value> {
    type Other = HeadTail<HeadGeneric, Nothing>;

    fn split(self) -> (HeadTail<HeadGeneric, Nothing>, Tail<Value>) {
        return (HeadTail::head(self.head), Tail(self.tail));
    }
}

impl<Value, TailGeneric> SplitTrait<Head<Value>> for HeadTail<Value, TailGeneric> {
    type Other = HeadTail<Nothing, TailGeneric>;

    fn split(self) -> (HeadTail<Nothing, TailGeneric>, Head<Value>) {
        return (HeadTail::tail(self.tail), Head(self.head));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use reconcilable_trait::mocks::AlwaysReconcileValue;

    fn expect_head_tail_strings<'a, 'b>(head_tail: HeadTail<&'a str, &'b str>) {
        assert_eq!(head_tail.head, "head");
        assert_eq!(head_tail.tail, "tail");
    }

    #[test]
    fn new() {
        expect_head_tail_strings(HeadTail::new("head", "tail"));
    }

    #[test]
    fn merge_head() {
        expect_head_tail_strings(HeadTail::head("head").merge(Tail("tail")));
    }

    #[test]
    fn merge_tail() {
        expect_head_tail_strings(HeadTail::tail("tail").merge(Head("head")));
    }

    #[test]
    fn merge_head_none() {
        assert_eq!(
            HeadTail::tail("tail")
                .merge_option(None::<Head<&'_ str>>)
                .unwrap_err(),
            HeadTail::tail("tail")
        );
    }

    #[test]
    fn merge_head_some() {
        expect_head_tail_strings(
            HeadTail::tail("tail")
                .merge_option(Some(Head("head")))
                .unwrap(),
        );
    }

    #[test]
    fn merge_tail_none() {
        assert_eq!(
            HeadTail::head("head")
                .merge_option(None::<Tail<&'_ str>>)
                .unwrap_err(),
            HeadTail::head("head")
        );
    }

    #[test]
    fn merge_tail_some() {
        expect_head_tail_strings(
            HeadTail::head("head")
                .merge_option(Some(Tail("tail")))
                .unwrap(),
        );
    }

    #[test]
    fn split_head() {
        let (tail_only, Head(head)) = HeadTail::new("split", "tail").split();
        assert_eq!(head, "split");
        assert_eq!(tail_only, HeadTail::tail("tail"));
    }

    #[test]
    fn split_tail() {
        let (head_only, Tail(split_tail)) = HeadTail::new("head", "split").split();
        assert_eq!(split_tail, "split");
        assert_eq!(head_only, HeadTail::head("head"));
    }

    #[test]
    fn reconcile_head() {
        let reconciled = HeadTail::new(AlwaysReconcileValue::<u32>::new(), Nothing)
            .reconcile(Head(1))
            .unwrap();
        assert_eq!(reconciled, HeadTail::head(1));
    }
}
