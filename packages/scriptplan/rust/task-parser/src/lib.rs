use std::{str::Chars, iter::Enumerate, collections::VecDeque};

struct Root {

}

struct Var {
  
}

struct Completed;

struct Pending;

pub struct EndAtIdentifier<Identifier, Content, Consumer, State> {
  start_identifier: Identifier,
  content: Content,
  end_identifer: Identifier,
  nested_consumer: Option<Consumer>,
  state: State,
}

pub enum EndAtIdentifierResult<Identifier, Content, Consumer> {
  Completed(EndAtIdentifier<Identifier, Content, Consumer, Completed>),
  Incomplete(EndAtIdentifier<Identifier, Content, Consumer, Pending>),
}

impl<I : std::cmp::PartialEq, Content: std::ops::Add<Output = I>> EndAtIdentifier<I, Content, Pending> {
  pub fn consume(self, next: I) -> EndAtIdentifierResult<I, Content> {
    if ()
    if self.end_identifer == next {
      EndAtIdentifierResult::Completed(EndAtIdentifier {
        start_identifier: self.start_identifier,
        content: self.content,
        end_identifer: self.end_identifer,
        nested_consumers: 
        state: Completed
      })
    } else {
      Next::End(EndAtIdentifier {
        start_identifier: self.start_identifier,
        content: self.content + next,
        end_identifer: self.end_identifer,
        state: Pending,
      })
    }
  }
}

/*
pub struct TokenizerImpl<I : Iterator> {
  chars_iter: I,
}

impl<I : Iterator> TokenizerImpl<I> {
  pub fn new(chars_iter: I) -> TokenizerImpl<I> {
    TokenizerImpl {
      chars_iter
    }
  } 
}

impl<I : Iterator> TokenizerImpl<I> {
  pub fn tokenize() -> Option<(, TokenizerImpl<I>)> {
    let next_char = '';

  }
}

pub fn parse<'a>(a_string: &'a str) -> TokenizerImpl<Enumerate<Chars<'a>>> {
  TokenizerImpl::new(a_string.chars().enumerate())
}*/
