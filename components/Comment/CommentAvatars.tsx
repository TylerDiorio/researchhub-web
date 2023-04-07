import { css, StyleSheet } from "aphrodite";
import { RHUser } from "~/config/types/root_types";
import AuthorAvatar from "../AuthorAvatar";
import UserTooltip from "../Tooltips/User/UserTooltip";

type CommentAvatarsArgs = {
  people: RHUser[];
  withTooltip?: boolean;
  spacing?: number;
  size?: number;
  wrapperStyle?: any;
};

const CommentAvatars = ({ people, withTooltip = false, spacing = 0, size = 30, wrapperStyle }: CommentAvatarsArgs) => {
  return (
    <div className={css(styles.avatarsWrapper, wrapperStyle)}>

      {people.map((p, idx) => {

        const avatarEl = <div className={css(styles.avatarWrapper)}>
          <AuthorAvatar
            author={p.authorProfile}
            size={size}
            trueSize={true}
          />
        </div>

        return (
          <div className={css(styles.person)} key={`avatar-${idx}`} style={{marginLeft: idx === 0 ? 0 : spacing}} >
            {withTooltip ? (
              <UserTooltip
                createdBy={p}
                overrideTargetStyle={styles.avatarWrapper}
                targetContent={
                  avatarEl
                }
              />
            ) : (
              avatarEl
            )}
          </div>
        )
      })}
    </div>
  );
};

const styles = StyleSheet.create({
  avatarsWrapper: {
    display: "flex",
    alignItems: "center",
    columnGap: "7px",
    fontSize: 15,
    marginTop: 3,
  },
  person: {
    
  },
  avatarWrapper: {

  }
});

export default CommentAvatars;
