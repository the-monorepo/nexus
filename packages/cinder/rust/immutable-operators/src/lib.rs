/**
 * An immutable trait for popping a value out of an object
 */
pub trait SplitTrait<Value> {
    type Other;
    fn split(self) -> (Self::Other, Value);

    fn split_value(self) -> Value
    where
        Self: Sized,
    {
        self.split().1
    }

    fn split_other(self) -> Self::Other
    where
        Self: Sized,
    {
        self.split().0
    }
}

/**
 * An immutable trait for adding a value int oa an object
 */
pub trait MergeTrait<Value> {
    type MergedObject;
    fn merge(self, value: Value) -> Self::MergedObject;

    fn merge_option(self, value_option: Option<Value>) -> Result<Self::MergedObject, Self>
    where
        Self: Sized,
    {
        if let Some(value) = value_option {
            Ok(self.merge(value))
        } else {
            Err(self)
        }
    }
}

pub trait MapTrait<Value, MappedValue> {
    type MappedObject;
    fn map<F: FnOnce(Value) -> MappedValue>(self, wrap_value: F) -> Self::MappedObject;
}
