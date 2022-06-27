use std::collections::VecDeque;
use std::sync::Arc;

pub type VarArgs = VecDeque<Arc<String>>;

pub fn has_parameters(args: &VarArgs) -> bool {
  args.iter().any(|arg| (*arg).contains("$"))
}

pub fn apply_args(command_args: &VarArgs, substitutions: &VarArgs) -> VarArgs {
  command_args
    .iter()
    .map(|arg| {
        let arc = arg.clone();
        let char_result = arc.chars().nth(0);
        if char_result.map_or_else(|| false, |c| c == '$') && arc.len() >= 2
        {
            let index_string_slice = &arc[1..arc.len()];
            if index_string_slice.chars().all(char::is_numeric) {
                let index = index_string_slice.parse().unwrap();
                if index < substitutions.len() {
                    return substitutions[index].clone();
                } else {
                    panic!("{} was not provided", index);
                }
            } else {
                return arc;
            }
        } else {
            return arc;
        }
    })
    .collect()
}