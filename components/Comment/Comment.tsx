import CommentHeader from "./CommentHeader";
import CommentReadOnly from "./CommentReadOnly";
import { css, StyleSheet } from "aphrodite";
import CommentActions from "./CommentActions";
import { Comment as CommentType } from "./lib/types";
import { useState } from "react";
import CommentEditor from "./CommentEditor";
import { TopLevelDocument } from "~/config/types/root_types";
import colors from "./lib/colors";

type CommentArgs = {
  comment: CommentType;
  handleUpdate: Function;
  handleCreate: Function;
  document: TopLevelDocument;
};

const Comment = ({ comment, document, handleUpdate, handleCreate }: CommentArgs) => {
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <div>
      <div>
        <div className={css(styles.headerWrapper)}>
          <CommentHeader
            authorProfile={comment.createdBy.authorProfile}
            timeAgo={comment.timeAgo}
            bounties={[]}
          />
        </div>
        {isEditMode ? (
          <CommentEditor
            handleSubmit={({ content }) => handleUpdate({ comment, content })}
            content={comment.content}
            editorId={`edit-${comment.id}`}
          />
        ) : (
          <div className={css(styles.commentReadOnlyWrapper)}>
            <CommentReadOnly content={comment.content} />
          </div>
        )}
        <div className={css(styles.actionsWrapper)}>
          <CommentActions
            handleEdit={() => setIsEditMode(!isEditMode)}
            handleReply={() => setIsReplyOpen(!isReplyOpen)}
            document={document}
            comment={comment}
          />
        </div>
      </div>
      {isReplyOpen && (
        <CommentEditor
          handleSubmit={({ content }) => handleUpdate({ content })}
          editorId={`reply-to-${comment.id}`}
        />
      )}
      <div className={css(styles.children)}>
        {comment.children.map((c) => (
          <div key={c.id} className={css(styles.commentWrapper)}>
            <Comment
              handleUpdate={handleUpdate}
              handleCreate={handleCreate}
              comment={c}
              document={document}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = StyleSheet.create({
  children: {
    marginLeft: 10,
    paddingLeft: 15,
    borderLeft: `2px solid ${colors.border}`,
    paddingTop: 15,
  },
  headerWrapper: {
    marginBottom: 10,
  },
  commentWrapper: {
    marginTop: 5,
  },
  actionsWrapper: {
  },
  commentReadOnlyWrapper: {
    marginBottom: 15,
  }  
});

export default Comment;
